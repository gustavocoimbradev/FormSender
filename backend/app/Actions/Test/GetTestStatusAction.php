<?php

declare(strict_types=1);

namespace App\Actions\Test;

final class GetTestStatusAction
{
    /**
     * @return array{status: string, app: string, timestamp: string}
     */
    public function execute(): array
    {
        return [
            'status' => 'ok',
            'app' => (string) config('app.name'),
            'timestamp' => now()->toIso8601String(),
        ];
    }
}
