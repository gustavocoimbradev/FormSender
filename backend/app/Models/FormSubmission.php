<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property list<array<string, mixed>> $fields
 * @property array<string, mixed> $data
 * @property list<string> $destinations
 * @property list<array{destination: string, status: string, error: ?string, sent_at: ?string}> $deliveries
 */
/**
 * @property Form|null $form
 * @property list<array{code: string, field: string, name: string, path: string, size: int, mime: string}> $attachments
 */
class FormSubmission extends Model
{
    use Prunable;

    protected $fillable = [
        'user_id', 'form_id', 'form_name', 'fields', 'data', 'attachments', 'destinations', 'deliveries',
        'status', 'attempts', 'error', 'ip', 'origin', 'user_agent', 'processed_at',
    ];

    protected $attributes = [
        'status' => 'pending',
        'attempts' => 0,
        'attachments' => '[]',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'data' => 'array',
            'attachments' => 'array',
            'destinations' => 'array',
            'deliveries' => 'array',
            'status' => SubmissionStatus::class,
            'processed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Form, $this>
     */
    /**
     * Old messages are deleted every day once a retention period is set.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        $days = Setting::retentionDays();

        return static::query()->where('created_at', '<', now()->subDays($days > 0 ? $days : 36500));
    }

    protected function pruning(): void
    {
        $this->deleteAttachments();
    }

    public function deleteAttachments(): void
    {
        Storage::disk(config('formsender.attachments.disk'))->deleteDirectory(self::attachmentsDirectory($this->id));
    }

    public static function attachmentsDirectory(int $submissionId): string
    {
        return "submission-attachments/{$submissionId}";
    }

    /**
     * @return array{code: string, field: string, name: string, path: string, size: int, mime: string}|null
     */
    public function attachment(string $code): ?array
    {
        return collect($this->attachments)->firstWhere('code', $code);
    }

    /**
     * The first email the visitor typed, so replying to the message answers them.
     */
    public function replyToAddress(): ?string
    {
        foreach ($this->fields as $field) {
            $value = $this->data[$field['name']] ?? null;

            if (($field['type'] ?? null) === 'email' && is_string($value) && filter_var($value, FILTER_VALIDATE_EMAIL) !== false) {
                return $value;
            }
        }

        return null;
    }

    /**
     * @return BelongsTo<Form, $this>
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
