<?php

declare(strict_types=1);

namespace App\Enums;

use Dedoc\Scramble\Attributes\SchemaName;

/**
 * What a visitor gets after sending a form.
 */
#[SchemaName('ResponseType')]
enum FormResponseType: string
{
    /** A short JSON answer, which also carries the thank-you page address. */
    case Json = 'json';

    /** The visitor is sent straight to the thank-you page. */
    case Redirect = 'redirect';
}
