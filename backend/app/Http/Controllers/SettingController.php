<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\Resources\Json\JsonResource;

class SettingController extends Controller
{
    public function show(): JsonResource
    {
        return $this->respond();
    }

    public function update(UpdateSettingsRequest $request): JsonResource
    {
        $smtp = $request->validated('smtp');

        if (blank($smtp['password'] ?? null)) {
            $smtp['password'] = Setting::where('key', 'smtp')->first()?->value['password'] ?? null;
        }

        Setting::updateOrCreate(['key' => 'smtp'], ['value' => $smtp]);

        return $this->respond();
    }

    private function respond(): JsonResource
    {
        return new JsonResource([
            'smtp' => Setting::where('key', 'smtp')->first()?->value,
        ]);
    }
}
