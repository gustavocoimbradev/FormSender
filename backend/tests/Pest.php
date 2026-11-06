<?php

declare(strict_types=1);

use App\Actions\Submission\StoreFormSubmissionAction;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Pest\Expectation;
use Tests\TestCase;

// Tests never touch the real Redis, whatever the environment says (inside Docker it points at Redis):
// each test gets a fresh in-memory cache, queue and session. Set before the app boots.
foreach (['CACHE_STORE' => 'array', 'QUEUE_CONNECTION' => 'sync', 'SESSION_DRIVER' => 'array'] as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key] = $value;
    $_SERVER[$key] = $value;
}

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function (): Expectation {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something(): void
{
    // ..
}

function actingAsUser(): User
{
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    return $user;
}

function actingAsAdmin(): User
{
    $admin = User::factory()->admin()->create();
    Sanctum::actingAs($admin);

    return $admin;
}

function actingAsOwner(?User $owner = null): User
{
    $owner ??= User::factory()->owner()->create();
    Sanctum::actingAs($owner);

    return $owner;
}

function submissionFor(Form $form, array $overrides = []): FormSubmission
{
    return FormSubmission::create([
        'form_id' => $form->id,
        'form_name' => $form->name,
        'fields' => $form->fields,
        'data' => ['name' => 'Jane', 'email' => 'jane@example.com'],
        'destinations' => ['sales@example.com'],
        'deliveries' => [['destination' => 'sales@example.com', 'status' => 'pending', 'error' => null, 'sent_at' => null]],
        'status' => 'pending',
        ...$overrides,
    ]);
}

function submissionFromDaysAgo(int $days): FormSubmission
{
    $submission = app(StoreFormSubmissionAction::class)->execute(contactForm(), validSubmission());
    $submission->forceFill(['created_at' => now()->subDays($days)])->save();

    return $submission;
}

function configureSmtp(): void
{
    Setting::create(['key' => 'smtp', 'value' => [
        'host' => 'smtp.example.com',
        'port' => 465,
        'username' => 'user',
        'password' => 'secret',
        'encryption' => 'ssl',
        'from_address' => 'no-reply@example.com',
        'from_name' => 'FormSender',
    ]]);
}

function contactForm(array $overrides = []): Form
{
    return Form::factory()->create([
        'name' => 'Contact',
        'fields' => [
            ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'required' => true],
            ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'required' => true],
            ['name' => 'message', 'label' => 'Message', 'type' => 'textarea', 'required' => false],
            ['name' => 'topic', 'label' => 'Topic', 'type' => 'select', 'required' => false, 'options' => ['Sales', 'Support']],
            ['name' => 'age', 'label' => 'Age', 'type' => 'number', 'required' => false],
            ['name' => 'newsletter', 'label' => 'Newsletter', 'type' => 'checkbox', 'required' => false],
            ['name' => 'birthday', 'label' => 'Birthday', 'type' => 'date', 'required' => false],
        ],
        'destinations' => ['sales@example.com', 'support@example.com'],
        'allowed_domains' => [],
        ...$overrides,
    ]);
}

function validSubmission(array $overrides = []): array
{
    return ['name' => 'Jane', 'email' => 'jane@example.com', ...$overrides];
}
