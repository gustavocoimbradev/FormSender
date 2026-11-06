<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One link sent by email, to confirm that an address belongs to the person who gave it: the address of an account
        // or an address that receives a form's messages. Only a fingerprint of the token is kept.
        Schema::create('email_confirmations', function (Blueprint $table): void {
            $table->id();
            $table->string('email');
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('form_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();
        });

        // Accounts that exist before confirmations did were made by the administrator: they are ready to use.
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        Schema::dropIfExists('email_confirmations');
    }
};
