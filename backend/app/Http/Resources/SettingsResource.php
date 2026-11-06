<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Setting;
use Dedoc\Scramble\Attributes\SchemaName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Setting
 */
#[SchemaName('Settings')]
class SettingsResource extends JsonResource
{
    /**
     * @return array{smtp: array{host: string, port: int, username: string|null, password: string|null, encryption: string|null, from_address: string, from_name: string|null}|null, allow_registration: bool, retention_days: int}
     */
    public function toArray(Request $request): array
    {
        return [
            /**
             * The email server (SMTP) used to deliver messages, or null when none was saved yet.
             */
            'smtp' => $this->value,
            /** Whether anyone can create an account. When false, only the administrator creates accounts. */
            'allow_registration' => Setting::registrationOpen(),
            /** How many days messages are kept before they are deleted, with their files. 0 keeps them forever. */
            'retention_days' => Setting::retentionDays(),
        ];
    }
}
