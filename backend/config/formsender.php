<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Message retention
    |--------------------------------------------------------------------------
    |
    | Messages (and their attachments) older than this many days are deleted
    | every day by `model:prune`. Use 0 to keep everything forever.
    |
    */

    'submission_retention_days' => (int) env('SUBMISSION_RETENTION_DAYS', 90),

    /*
    |--------------------------------------------------------------------------
    | Attachments
    |--------------------------------------------------------------------------
    |
    | Files sent through a "file" field are stored on this disk (private, never
    | public) and attached to the email. The web server must also accept bodies
    | this large (`upload_max_filesize` and `post_max_size`).
    |
    */

    'attachments' => [
        'disk' => env('ATTACHMENTS_DISK', 'local'),
        'max_kilobytes' => (int) env('ATTACHMENT_MAX_KILOBYTES', 5120),
        'extensions' => [
            'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'rtf', 'txt', 'csv',
            'png', 'jpg', 'jpeg', 'gif', 'webp',
        ],
    ],

];
