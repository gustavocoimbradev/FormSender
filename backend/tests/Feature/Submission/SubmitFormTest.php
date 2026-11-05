<?php

declare(strict_types=1);

use App\Jobs\SendFormSubmission;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\Setting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

beforeEach(function (): void {
    Queue::fake();
    configureSmtp();
});

it('accepts a submission, saves it and queues the delivery', function (): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['message' => 'Hello']), [
        'Origin' => 'https://site.test',
        'User-Agent' => 'TestBrowser/1.0',
    ])
        ->assertStatus(202)
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonStructure(['message', 'data' => ['id', 'status']]);

    $submission = FormSubmission::sole();

    expect($submission->form_id)->toBe($form->id)
        ->and($submission->form_name)->toBe('Contact')
        ->and($submission->status->value)->toBe('pending')
        ->and($submission->data)->toBe(['name' => 'Jane', 'email' => 'jane@example.com', 'message' => 'Hello'])
        ->and($submission->destinations)->toBe(['sales@example.com', 'support@example.com'])
        ->and($submission->deliveries)->toBe([
            ['destination' => 'sales@example.com', 'status' => 'pending', 'error' => null, 'sent_at' => null],
            ['destination' => 'support@example.com', 'status' => 'pending', 'error' => null, 'sent_at' => null],
        ])
        ->and($submission->ip)->toBe('127.0.0.1')
        ->and($submission->origin)->toBe('site.test')
        ->and($submission->user_agent)->toBe('TestBrowser/1.0')
        ->and($submission->attempts)->toBe(0);

    Queue::assertPushed(SendFormSubmission::class, fn ($job) => $job->submission->is($submission));
});

it('answers without sending any email during the request', function (): void {
    Mail::fake();
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(202);

    Mail::assertNothingSent();
    Queue::assertPushed(SendFormSubmission::class, 1);
});

it('drops fields the form does not accept', function (): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['is_admin' => true, 'extra' => 'x']))
        ->assertStatus(202);

    expect(FormSubmission::sole()->data)->toBe(['name' => 'Jane', 'email' => 'jane@example.com']);
});

it('does not need any token or login: the form code in the address is enough', function (): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(202);
});

it('ignores an Authorization header, it is not used anymore', function (): void {
    $form = contactForm();

    $this->withToken('anything')->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(202);
});

it('does not accept the numeric id of the form in the address', function (): void {
    $form = contactForm();

    $this->postJson('/api/forms/'.$form->id.'/submit', validSubmission())->assertNotFound();

    expect(FormSubmission::count())->toBe(0);
});

it('returns 404 for an unknown code', function (): void {
    $this->postJson('/api/forms/doesnotexist0000000000/submit', validSubmission())->assertNotFound();
});

it('validates the submission against the accepted fields', function (array $overrides, string $errorKey): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);

    Queue::assertNothingPushed();
    expect(FormSubmission::count())->toBe(0);
})->with([
    'missing required field' => [['name' => null], 'name'],
    'invalid email' => [['email' => 'nope'], 'email'],
    'select value not in options' => [['topic' => 'Other'], 'topic'],
    'number not numeric' => [['age' => 'abc'], 'age'],
    'checkbox not boolean' => [['newsletter' => 'maybe'], 'newsletter'],
    'invalid date' => [['birthday' => 'not-a-date'], 'birthday'],
    'text too long' => [['name' => str_repeat('a', 256)], 'name'],
]);

it('accepts optional fields of every type', function (): void {
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission([
        'topic' => 'Sales', 'age' => 30, 'newsletter' => true, 'birthday' => '1990-05-20', 'message' => 'Hi',
    ]))->assertStatus(202);
});

it('refuses submissions when the form has no destinations', function (): void {
    $form = contactForm(['destinations' => []]);

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertUnprocessable();

    Queue::assertNothingPushed();
    expect(FormSubmission::count())->toBe(0);
});

it('refuses submissions when smtp is not configured', function (): void {
    Setting::where('key', 'smtp')->delete();
    $form = contactForm();

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(503);

    Queue::assertNothingPushed();
    expect(FormSubmission::count())->toBe(0);
});

it('throttles submissions per form and ip', function (): void {
    $form = contactForm();

    foreach (range(1, 20) as $attempt) {
        $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(202);
    }

    $this->postJson("/api/forms/{$form->code}/submit", validSubmission())->assertStatus(429);
});

describe('allowed domains', function (): void {
    it('lets any origin, or none, submit when the list is empty', function (): void {
        $form = contactForm(['allowed_domains' => []]);
        $url = "/api/forms/{$form->code}/submit";

        $this->postJson($url, validSubmission())->assertStatus(202);
        $this->postJson($url, validSubmission(), ['Origin' => 'https://anything.test'])->assertStatus(202);
    });

    it('accepts an allowed origin, ignoring scheme, port and case', function (string $origin): void {
        $form = contactForm(['allowed_domains' => ['example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), ['Origin' => $origin])
            ->assertStatus(202);
    })->with(['https://example.com', 'http://example.com:8080', 'https://EXAMPLE.com']);

    it('falls back to the referer when there is no origin', function (): void {
        $form = contactForm(['allowed_domains' => ['example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), ['Referer' => 'https://example.com/contact?x=1'])
            ->assertStatus(202);
    });

    it('matches subdomains with a wildcard, but not the apex or lookalikes', function (string $origin, int $status): void {
        $form = contactForm(['allowed_domains' => ['*.example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), ['Origin' => $origin])
            ->assertStatus($status);
    })->with([
        'subdomain' => ['https://www.example.com', 202],
        'deep subdomain' => ['https://a.b.example.com', 202],
        'apex' => ['https://example.com', 403],
        'lookalike suffix' => ['https://badexample.com', 403],
        'lookalike prefix' => ['https://example.com.evil.test', 403],
    ]);

    it('rejects other origins and requests without origin or referer', function (array $headers): void {
        $form = contactForm(['allowed_domains' => ['example.com']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(), $headers)
            ->assertForbidden();

        Queue::assertNothingPushed();
    expect(FormSubmission::count())->toBe(0);
    })->with([
        'other origin' => [['Origin' => 'https://evil.test']],
        'null origin' => [['Origin' => 'null']],
        'other referer' => [['Referer' => 'https://evil.test/x']],
        'no headers' => [[]],
    ]);
});

describe('honeypot', function (): void {
    it('quietly accepts a submission whose hidden _gotcha field was filled by a bot, without saving or sending it', function (): void {
        $form = contactForm();

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => 'http://spam.test']))
            ->assertStatus(202)
            ->assertJsonStructure(['message', 'data' => ['id', 'status']]);

        expect(FormSubmission::count())->toBe(0);
        Queue::assertNothingPushed();
    });

    it('does not tell a bot anything even when the rest of its payload is invalid', function (): void {
        $form = contactForm();

        $this->postJson("/api/forms/{$form->code}/submit", ['_gotcha' => 'x'])->assertStatus(202);

        expect(FormSubmission::count())->toBe(0);
    });

    it('accepts people: an empty _gotcha is ignored and never stored', function (): void {
        $form = contactForm();

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => '']))->assertStatus(202);

        expect(FormSubmission::sole()->data)->not->toHaveKey('_gotcha');
        Queue::assertPushed(SendFormSubmission::class, 1);
    });

    it('still honors the allowed sites for bots', function (): void {
        $form = contactForm(['allowed_domains' => ['site.test']]);

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => 'x']), ['Origin' => 'https://evil.test'])->assertForbidden();
    });
});
