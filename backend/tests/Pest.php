<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

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

expect()->extend('toBeOne', function (): Pest\Expectation {
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

function actingAsUser(): App\Models\User
{
    $user = App\Models\User::factory()->create();
    Laravel\Sanctum\Sanctum::actingAs($user);

    return $user;
}

function actingAsAdmin(): App\Models\User
{
    $admin = App\Models\User::factory()->admin()->create();
    Laravel\Sanctum\Sanctum::actingAs($admin);

    return $admin;
}

function actingAsOwner(?App\Models\User $owner = null): App\Models\User
{
    $owner ??= App\Models\User::factory()->owner()->create();
    Laravel\Sanctum\Sanctum::actingAs($owner);

    return $owner;
}

function configureSmtp(): void
{
    App\Models\Setting::create(['key' => 'smtp', 'value' => [
        'host' => 'smtp.example.com',
        'port' => 465,
        'username' => 'user',
        'password' => 'secret',
        'encryption' => 'ssl',
        'from_address' => 'no-reply@example.com',
        'from_name' => 'FormSender',
    ]]);
}

function contactForm(array $overrides = []): App\Models\Form
{
    return App\Models\Form::factory()->create([
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

