<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;

use function Laravel\Prompts\password;

class CreateUser extends Command
{
    protected $signature = 'user:create {email} {--name=} {--role=user} {--password=}';

    protected $description = 'Create a user (role: admin or user)';

    public function handle(): int
    {
        $role = Role::tryFrom($this->option('role'));

        if ($role === null) {
            $this->error('Invalid role. Use "admin" or "user".');

            return self::FAILURE;
        }

        $user = new User([
            'name' => $this->option('name') ?: $this->argument('email'),
            'email' => $this->argument('email'),
            'password' => $this->option('password') ?: password('Password'),
        ]);
        $user->role = $role;
        $user->save();

        $this->info("User {$user->email} created as {$role->value}.");

        return self::SUCCESS;
    }
}
