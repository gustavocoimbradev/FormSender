<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property list<array<string, mixed>> $fields
 * @property array<string, mixed> $data
 * @property list<string> $destinations
 * @property list<array{destination: string, status: string, error: ?string, sent_at: ?string}> $deliveries
 */
class FormSubmission extends Model
{
    protected $fillable = [
        'form_id', 'form_name', 'fields', 'data', 'destinations', 'deliveries',
        'status', 'attempts', 'error', 'ip', 'origin', 'user_agent', 'processed_at',
    ];

    protected $attributes = [
        'status' => 'pending',
        'attempts' => 0,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fields' => 'array',
            'data' => 'array',
            'destinations' => 'array',
            'deliveries' => 'array',
            'status' => SubmissionStatus::class,
            'processed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Form, $this>
     */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
