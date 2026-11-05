<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;

#[SchemaName('TemplateChanges')]
class UpdateTemplateRequest extends StoreTemplateRequest {}
