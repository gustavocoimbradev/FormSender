<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use App\Http\Resources\SettingsResource;
use App\Models\Setting;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;

#[Group('Settings', description: 'Email (SMTP) settings used to deliver the messages, whether new accounts are allowed and how long messages are kept. Admin only.', weight: 8)]
class SettingController extends Controller
{
    /**
     * Get the settings.
     *
     * Admin only. Returns the SMTP settings used to deliver emails (`null` if none), password included, `allow_registration` and `retention_days`.
     */
    #[Endpoint(operationId: 'getSettings')]
    public function show(): SettingsResource
    {
        return $this->respond();
    }

    /**
     * Save the settings.
     *
     * Admin only. Send `smtp` to replace the email server, `allow_registration` to open or close new accounts and `retention_days` to choose how long messages are kept; each is optional. A blank `password` keeps the current one. `encryption` is `ssl`, `tls` or empty.
     */
    #[Endpoint(operationId: 'saveSettings')]
    public function update(UpdateSettingsRequest $request): SettingsResource
    {
        if ($request->has('smtp')) {
            $smtp = $request->validated('smtp');

            if (blank($smtp['password'] ?? null)) {
                $smtp['password'] = Setting::where('key', 'smtp')->first()?->value['password'] ?? null;
            }

            Setting::updateOrCreate(['key' => 'smtp'], ['value' => $smtp]);
        }

        if ($request->has('retention_days')) {
            Setting::updateOrCreate(['key' => 'retention'], ['value' => ['days' => $request->integer('retention_days')]]);
        }

        if ($request->has('allow_registration')) {
            Setting::updateOrCreate(['key' => 'registration'], ['value' => ['open' => $request->boolean('allow_registration')]]);
        }

        return $this->respond();
    }

    private function respond(): SettingsResource
    {
        return new SettingsResource(Setting::where('key', 'smtp')->first() ?? new Setting(['key' => 'smtp']));
    }
}
