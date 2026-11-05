<?php

declare(strict_types=1);

namespace App\Enums;

use Dedoc\Scramble\Attributes\SchemaName;
#[SchemaName('FieldType')]
enum FormFieldType: string
{
    case Text = 'text';
    case Email = 'email';
    case Phone = 'phone';
    case Number = 'number';
    case Textarea = 'textarea';
    case Select = 'select';
    case Checkbox = 'checkbox';
    case Date = 'date';
}
