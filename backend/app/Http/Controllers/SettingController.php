<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\Setting;
use App\Http\Resources\SettingsResource;

#[Group('Settings', description: 'Email (SMTP) settings used to deliver the messages. Admin only.', weight: 8)]
class SettingController extends Controller
{
    /**
     * Get the settings.
     *
     * Admin only. Returns the SMTP settings used to deliver emails (`null` if none), password included.
     */
    #[Endpoint(operationId: 'getSettings')]
    public function show(): SettingsResource
    {
        return $this->respond();
    }

    /**
     * Save the settings.
     *
     * Admin only. Replaces the SMTP settings. A blank `password` keeps the current one. `encryption` is `ssl`, `tls` or empty.
     */
    #[Endpoint(operationId: 'saveSettings')]
    public function update(UpdateSettingsRequest $request): SettingsResource
    {
        $smtp = $request->validated('smtp');

        if (blank($smtp['password'] ?? null)) {
            $smtp['password'] = Setting::where('key', 'smtp')->first()?->value['password'] ?? null;
        }

        Setting::updateOrCreate(['key' => 'smtp'], ['value' => $smtp]);

        return $this->respond();
    }

    private function respond(): SettingsResource
    {
        return new SettingsResource([
            'smtp' => Setting::where('key', 'smtp')->first()?->value,
        ]);
    }
}
