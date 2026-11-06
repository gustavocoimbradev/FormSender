<?php

declare(strict_types=1);

use App\Support\DefaultEmailTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The email now belongs to each form: its subject and HTML live on the form (empty means the default
     * email). What the templates held is copied to the forms that used them, so no email changes.
     */
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table): void {
            $table->string('email_subject', 200)->nullable()->after('redirect_url');
            $table->longText('email_html')->nullable()->after('email_subject');
        });

        foreach (DB::table('templates')->get() as $template) {
            $forms = DB::table('forms')->where(function ($query) use ($template): void {
                $query->where('template_id', $template->id);

                // A form without a template used the default one.
                if ($template->is_default) {
                    $query->orWhereNull('template_id');
                }
            });

            $forms->update([
                'email_subject' => $template->subject === DefaultEmailTemplate::SUBJECT ? null : $template->subject,
                'email_html' => $template->html === DefaultEmailTemplate::HTML ? null : $template->html,
            ]);
        }

        Schema::table('forms', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('template_id');
        });

        Schema::dropIfExists('templates');
    }

    public function down(): void
    {
        Schema::create('templates', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name');
            $table->string('subject');
            $table->longText('html');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::table('forms', function (Blueprint $table): void {
            $table->foreignId('template_id')->nullable()->after('allowed_domains')->constrained('templates')->nullOnDelete();
            $table->dropColumn(['email_subject', 'email_html']);
        });
    }
};
