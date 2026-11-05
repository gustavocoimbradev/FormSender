<?php

declare(strict_types=1);

use Dedoc\Scramble\Generator;
use Dedoc\Scramble\Scramble;

it('has no documentation warnings', function (): void {
    $result = app(Generator::class)->generate(Scramble::getGeneratorConfig('default'));

    expect($result->diagnostics()->toArray())->toBe([]);
});
