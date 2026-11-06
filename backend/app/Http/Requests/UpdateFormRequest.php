<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Dedoc\Scramble\Attributes\SchemaName;

#[SchemaName('FormChanges')]
class UpdateFormRequest extends StoreFormRequest {}
