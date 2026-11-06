<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\FormSubmission;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin FormSubmission
 */
#[SchemaName('Submission')]
class FormSubmissionResource extends JsonResource
{
    /**
     * @return array{id: int, form_name: string, status: string, values: array<string, mixed>, attachments: list<array{code: string, field: string, name: string, size: int, mime: string}>, destinations: list<string>, deliveries: list<array{destination: string, status: string, error: string|null, sent_at: string|null}>, attempts: int, error: string|null, ip: string|null, origin: string|null, user_agent: string|null, created_at: Carbon|null, processed_at: Carbon|null}
     */
    public function toArray(Request $request): array
    {
        return [
            /** Identifier of the submission. */
            'id' => $this->id,
            /** Name of the form when the message was received. */
            'form_name' => $this->form_name,
            /** Where it is in the delivery: `pending`, `processing`, `sent`, `partial` (some destinations failed) or `failed`. */
            'status' => $this->status->value,
            /** What the visitor filled in, by field name. */
            'values' => $this->data,
            /** Files the visitor sent through `file` fields. Download one with its `code`. */
            'attachments' => array_map(
                fn (array $attachment): array => [
                    /** Identifies the file when downloading it. */
                    'code' => $attachment['code'],
                    /** Name of the form field it was sent in. */
                    'field' => $attachment['field'],
                    /** Original file name. */
                    'name' => $attachment['name'],
                    /** Size in bytes. */
                    'size' => $attachment['size'],
                    /** Type of the file, such as `application/pdf`. */
                    'mime' => $attachment['mime'],
                ],
                $this->attachments,
            ),
            /** Email addresses it had to be delivered to. */
            'destinations' => $this->destinations,
            /** Delivery result for each destination. */
            'deliveries' => $this->deliveries,
            /** How many times delivery was tried. */
            'attempts' => $this->attempts,
            /** Why delivery failed, when it did. */
            'error' => $this->error,
            /** IP address of the visitor. */
            'ip' => $this->ip,
            /** Website the visitor was on. */
            'origin' => $this->origin,
            /** Browser of the visitor. */
            'user_agent' => $this->user_agent,
            /** When the message was received. */
            'created_at' => $this->created_at,
            /** When delivery finished. Empty while it is still going. */
            'processed_at' => $this->processed_at,
        ];
    }
}
