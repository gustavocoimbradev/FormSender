<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\FormSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin FormSubmission
 */
class FormSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'form_id' => $this->form_id,
            'form_name' => $this->form_name,
            'status' => $this->status->value,
            'values' => $this->data,
            'destinations' => $this->destinations,
            'deliveries' => $this->deliveries,
            'attempts' => $this->attempts,
            'error' => $this->error,
            'ip' => $this->ip,
            'origin' => $this->origin,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at,
            'processed_at' => $this->processed_at,
        ];
    }
}
