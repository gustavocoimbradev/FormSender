<?php

declare(strict_types=1);

use App\Models\Form;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;

function setQuotas(?int $forms = null, ?int $daily = null): void
{
    Setting::updateOrCreate(['key' => 'quotas'], ['value' => ['max_forms' => $forms, 'max_daily_submissions' => $daily]]);
}

/** A form of the account whose destinations are already confirmed, so only the limits decide. */
function quotaForm(User $owner): Form
{
    return contactForm(['user_id' => $owner->id, 'confirmed_destinations' => ['sales@example.com', 'support@example.com']]);
}

function sendTo(Form $form): TestResponse
{
    return test()->postJson("/api/forms/{$form->code}/submit", validSubmission());
}

beforeEach(function (): void {
    Queue::fake();
    configureSmtp();
});

describe('choosing the limits', function (): void {
    it('has no limits until the administrator sets them', function (): void {
        actingAsAdmin();

        $this->getJson('/api/settings')->assertOk()->assertJsonPath('data.quotas', ['max_forms' => null, 'max_daily_submissions' => null]);
    });

    it('saves both limits, and a blank one means unlimited', function (): void {
        actingAsAdmin();

        $this->putJson('/api/settings', ['quotas' => ['max_forms' => 3, 'max_daily_submissions' => 50]])
            ->assertOk()
            ->assertJsonPath('data.quotas', ['max_forms' => 3, 'max_daily_submissions' => 50]);

        $this->putJson('/api/settings', ['quotas' => ['max_forms' => null, 'max_daily_submissions' => '']])
            ->assertOk()
            ->assertJsonPath('data.quotas', ['max_forms' => null, 'max_daily_submissions' => null]);
    });

    it('does not touch the other settings', function (): void {
        actingAsAdmin();

        $this->putJson('/api/settings', ['quotas' => ['max_forms' => 3]])->assertOk()->assertJsonPath('data.smtp.host', 'smtp.example.com');
    });

    it('refuses what is not a whole number above zero', function (mixed $value): void {
        actingAsAdmin();

        $this->putJson('/api/settings', ['quotas' => ['max_forms' => $value]])->assertUnprocessable()->assertJsonValidationErrors('quotas.max_forms');
    })->with(['zero' => 0, 'negative' => -2, 'text' => 'many', 'decimal' => 1.5, 'huge' => 100000000]);

    it('is only for the administrator', function (): void {
        actingAsUser();

        $this->putJson('/api/settings', ['quotas' => ['max_forms' => 1]])->assertForbidden();
    });
});

describe('how many forms an account can have', function (): void {
    it('stops an account at its limit, with a clear message', function (): void {
        setQuotas(forms: 2);
        actingAsUser();

        $this->postJson('/api/forms', ['name' => 'One'])->assertCreated();
        $this->postJson('/api/forms', ['name' => 'Two'])->assertCreated();
        $this->postJson('/api/forms', ['name' => 'Three'])->assertForbidden()->assertJsonPath('message', 'You reached the limit of 2 forms. Delete one to create another.');
    });

    it('counts each account on its own', function (): void {
        setQuotas(forms: 1);
        Form::factory()->for(User::factory()->create())->create();
        actingAsUser();

        $this->postJson('/api/forms', ['name' => 'Mine'])->assertCreated();
    });

    it('applies to the administrator too', function (): void {
        setQuotas(forms: 1);
        $admin = actingAsAdmin();
        Form::factory()->for($admin)->create();

        $this->postJson('/api/forms', ['name' => 'Another'])->assertForbidden();
    });

    it('frees a place when a form is deleted, and never blocks changing a form that exists', function (): void {
        setQuotas(forms: 1);
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create();

        $this->putJson("/api/forms/{$form->code}", ['name' => 'Renamed'])->assertOk();
        $this->deleteJson("/api/forms/{$form->code}")->assertNoContent();
        $this->postJson('/api/forms', ['name' => 'New'])->assertCreated();
    });

    it('has no limit when none is set', function (): void {
        actingAsUser();

        foreach (range(1, 5) as $number) {
            $this->postJson('/api/forms', ['name' => "Form {$number}"])->assertCreated();
        }
    });
});

describe('how many messages an account receives a day', function (): void {
    it('stops at the limit and tells the visitor the daily limit was reached', function (): void {
        setQuotas(daily: 2);
        $form = quotaForm(User::factory()->create());

        sendTo($form)->assertStatus(202);
        sendTo($form)->assertStatus(202);
        sendTo($form)->assertStatus(429)->assertJsonPath('code', 'daily_limit');

        expect($form->submissions()->count())->toBe(2);
    });

    it('counts all the forms of the account together', function (): void {
        setQuotas(daily: 2);
        $owner = User::factory()->create();
        $first = quotaForm($owner);
        $second = quotaForm($owner);

        sendTo($first)->assertStatus(202);
        sendTo($second)->assertStatus(202);
        sendTo($first)->assertStatus(429)->assertJsonPath('code', 'daily_limit');
        sendTo($second)->assertStatus(429)->assertJsonPath('code', 'daily_limit');
    });

    it('counts each account on its own', function (): void {
        setQuotas(daily: 1);
        $busy = quotaForm(User::factory()->create());
        $quiet = quotaForm(User::factory()->create());

        sendTo($busy)->assertStatus(202);
        sendTo($busy)->assertStatus(429)->assertJsonPath('code', 'daily_limit');
        sendTo($quiet)->assertStatus(202);
    });

    it('applies to the administrator too', function (): void {
        setQuotas(daily: 1);
        $form = quotaForm(User::factory()->admin()->create());

        sendTo($form)->assertStatus(202);
        sendTo($form)->assertStatus(429)->assertJsonPath('code', 'daily_limit');
    });

    it('starts again the next day', function (): void {
        setQuotas(daily: 1);
        $form = quotaForm(User::factory()->create());
        sendTo($form)->assertStatus(202);
        sendTo($form)->assertStatus(429)->assertJsonPath('code', 'daily_limit');

        $this->travel(1)->days();

        sendTo($form)->assertStatus(202);
    });

    it('does not count what was caught as spam', function (): void {
        setQuotas(daily: 1);
        $form = quotaForm(User::factory()->create());

        $this->postJson("/api/forms/{$form->code}/submit", validSubmission(['_gotcha' => 'x']))->assertStatus(202);
        sendTo($form)->assertStatus(202);
    });

    it('still counts the messages of a form that was deleted today', function (): void {
        setQuotas(daily: 1);
        $owner = User::factory()->create();
        $form = quotaForm($owner);
        sendTo($form)->assertStatus(202);
        $form->delete();

        $another = quotaForm($owner);

        sendTo($another)->assertStatus(429)->assertJsonPath('code', 'daily_limit');
    });

    it('records whose message it is', function (): void {
        $owner = User::factory()->create();
        $form = quotaForm($owner);

        sendTo($form)->assertStatus(202);

        expect($form->submissions()->firstOrFail()->user_id)->toBe($owner->id);
    });

    it('has no limit when none is set', function (): void {
        $form = quotaForm(User::factory()->create());

        foreach (range(1, 5) as $ignored) {
            sendTo($form)->assertStatus(202);
        }
    });
});

describe('what an account has used', function (): void {
    it('shows the use of the account against each limit', function (): void {
        setQuotas(forms: 5, daily: 10);
        $user = actingAsUser();
        $form = Form::factory()->for($user)->create(['name' => 'Mine', 'destinations' => [$user->email]]);
        Form::factory()->for($user)->create();
        Form::factory()->for(User::factory()->create())->create();
        $form->update(['fields' => []]);
        sendTo(quotaForm($user))->assertStatus(202);
        sendTo(quotaForm(User::factory()->create()))->assertStatus(202);

        $this->getJson('/api/quotas')->assertOk()->assertExactJson(['data' => [
            'forms' => ['used' => 3, 'limit' => 5],
            'daily_submissions' => ['used' => 1, 'limit' => 10],
        ]]);
    });

    it('says there is no limit when none is set', function (): void {
        actingAsUser();

        $this->getJson('/api/quotas')->assertOk()->assertJsonPath('data.forms.limit', null)->assertJsonPath('data.daily_submissions.limit', null);
    });

    it('shows the administrator their own use, against the same limits', function (): void {
        setQuotas(forms: 2);
        $admin = actingAsAdmin();
        Form::factory()->for($admin)->create();
        Form::factory()->for(User::factory()->create())->create();

        $this->getJson('/api/quotas')->assertJsonPath('data.forms', ['used' => 1, 'limit' => 2]);
    });

    it('needs a login', function (): void {
        $this->getJson('/api/quotas')->assertUnauthorized();
    });
});
