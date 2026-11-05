<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Form;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class ExampleFormSeeder extends Seeder
{
    /**
     * Gives a fresh installation a working "Contact" form to look at and try (name and email required,
     * message optional), delivering to a fake address that Mailpit catches locally.
     *
     * It runs once only: it is skipped when forms already exist, and a marker keeps it from coming
     * back after someone deletes it, so this is safe to run on every `make up`.
     */
    public function run(): void
    {
        $marker = Setting::firstOrCreate(['key' => 'example_form_seeded'], ['value' => ['seeded' => true]]);

        if (! $marker->wasRecentlyCreated || Form::query()->exists()) {
            return;
        }

        Form::create([
            'name' => 'Contact',
            'fields' => [
                ['name' => 'name', 'label' => 'Name', 'type' => 'text', 'required' => true],
                ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'required' => true],
                ['name' => 'message', 'label' => 'Message', 'type' => 'textarea', 'required' => false],
            ],
            'destinations' => ['team@formsender.test'],
            'allowed_domains' => [],
        ]);
    }
}
