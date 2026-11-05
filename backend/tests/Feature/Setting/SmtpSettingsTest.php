<?php

beforeEach(fn () => actingAsAdmin());

use App\Models\Setting;

function smtpPayload(array $overrides = []): array
{
    return [
        'smtp' => [
            'host' => 'smtp.example.com',
            'port' => 587,
            'username' => 'user',
            'password' => 'secret-pass',
            'encryption' => 'tls',
            'from_address' => 'no-reply@example.com',
            'from_name' => 'FormSender',
            ...$overrides,
        ],
    ];
}

it('returns null smtp when it was never configured', function () {
    $this->getJson('/api/settings')
        ->assertOk()
        ->assertJsonPath('data.smtp', null);
});

it('saves the smtp settings and returns them, password included', function () {
    $this->putJson('/api/settings', smtpPayload())
        ->assertOk()
        ->assertJsonPath('data.smtp.host', 'smtp.example.com')
        ->assertJsonPath('data.smtp.port', 587)
        ->assertJsonPath('data.smtp.encryption', 'tls')
        ->assertJsonPath('data.smtp.from_address', 'no-reply@example.com')
        ->assertJsonPath('data.smtp.username', 'user')
        ->assertJsonPath('data.smtp.password', 'secret-pass');
});

it('returns the saved smtp settings', function () {
    $this->putJson('/api/settings', smtpPayload())->assertOk();

    $this->getJson('/api/settings')
        ->assertOk()
        ->assertJsonPath('data.smtp.host', 'smtp.example.com')
        ->assertJsonPath('data.smtp.password', 'secret-pass');
});

it('stores the smtp settings encrypted', function () {
    $this->putJson('/api/settings', smtpPayload())->assertOk();

    $raw = \Illuminate\Support\Facades\DB::table('settings')->where('key', 'smtp')->value('value');

    expect($raw)->not->toContain('secret-pass')->not->toContain('smtp.example.com');
    expect(Setting::where('key', 'smtp')->first()->value['password'])->toBe('secret-pass');
});

it('updates the existing smtp settings instead of creating another row', function () {
    $this->putJson('/api/settings', smtpPayload())->assertOk();
    $this->putJson('/api/settings', smtpPayload(['host' => 'smtp.other.com']))->assertOk();

    expect(Setting::where('key', 'smtp')->count())->toBe(1);
    $this->getJson('/api/settings')->assertJsonPath('data.smtp.host', 'smtp.other.com');
});

it('keeps the current password when none is sent', function () {
    $this->putJson('/api/settings', smtpPayload())->assertOk();
    $this->putJson('/api/settings', smtpPayload(['host' => 'smtp.other.com', 'password' => null]))->assertOk();

    expect(Setting::where('key', 'smtp')->first()->value['password'])->toBe('secret-pass');
});

it('accepts smtp settings without authentication or encryption', function () {
    $this->putJson('/api/settings', smtpPayload(['username' => null, 'password' => null, 'encryption' => null]))
        ->assertOk()
        ->assertJsonPath('data.smtp.password', null);
});

it('validates the smtp settings', function (array $payload, string $errorKey) {
    $this->putJson('/api/settings', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors($errorKey);
})->with([
    'missing smtp' => [[], 'smtp'],
    'missing host' => [fn () => smtpPayload(['host' => null]), 'smtp.host'],
    'missing port' => [fn () => smtpPayload(['port' => null]), 'smtp.port'],
    'port out of range' => [fn () => smtpPayload(['port' => 70000]), 'smtp.port'],
    'port not a number' => [fn () => smtpPayload(['port' => 'abc']), 'smtp.port'],
    'invalid encryption' => [fn () => smtpPayload(['encryption' => 'none']), 'smtp.encryption'],
    'missing from address' => [fn () => smtpPayload(['from_address' => null]), 'smtp.from_address'],
    'invalid from address' => [fn () => smtpPayload(['from_address' => 'not-an-email']), 'smtp.from_address'],
]);
