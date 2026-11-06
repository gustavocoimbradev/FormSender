<?php

declare(strict_types=1);

namespace App\Actions\Setup;

use App\Actions\Form\CreateContactFormAction;
use App\Enums\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CreateInitialAdminAction
{
    public function __construct(private readonly CreateContactFormAction $createContactForm) {}

    /**
     * Creates the owner account. Only works while no admin exists; the lock
     * stops two simultaneous requests from both creating an owner.
     *
     * When `smtp` is given, the email server settings are saved in the same transaction.
     *
     * @param  array{name?: ?string, email: string, password: string, allow_registration?: bool, smtp?: array<string, mixed>}  $data
     */
    public function execute(array $data): User
    {
        return Cache::lock('setup', 10)->block(5, function () use ($data): User {
            abort_if(User::where('role', Role::Admin)->exists(), 403, 'Setup has already been completed.');

            return DB::transaction(function () use ($data): User {
                $owner = new User([
                    'name' => $data['name'] ?? 'Admin',
                    'email' => $data['email'],
                    'password' => $data['password'],
                ]);
                $owner->role = Role::Admin;
                $owner->is_owner = true;
                $owner->email_verified_at = now();
                $owner->save();

                $this->createContactForm->execute($owner);

                Setting::updateOrCreate(['key' => 'registration'], ['value' => ['open' => (bool) ($data['allow_registration'] ?? false)]]);

                if (isset($data['smtp'])) {
                    Setting::updateOrCreate(['key' => 'smtp'], ['value' => $data['smtp']]);
                }

                return $owner;
            });
        });
    }
}
