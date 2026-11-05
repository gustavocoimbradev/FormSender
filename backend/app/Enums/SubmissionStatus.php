<?php

declare(strict_types=1);

namespace App\Enums;

enum SubmissionStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Sent = 'sent';
    case Partial = 'partial';
    case Failed = 'failed';
    /** Caught by the honeypot: kept for review, never delivered. */
    case Spam = 'spam';
}
