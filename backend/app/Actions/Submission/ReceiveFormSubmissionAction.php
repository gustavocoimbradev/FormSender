<?php

declare(strict_types=1);

namespace App\Actions\Submission;

use App\Jobs\SendFormSubmission;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Models\Setting;
use App\Support\AccountQuotas;

class ReceiveFormSubmissionAction
{
    public function __construct(private readonly StoreFormSubmissionAction $storeSubmission) {}

    /**
     * Saves an already validated submission and queues its delivery. Shared by the
     * public endpoint and by the panel's test.
     *
     * @param  array<string, mixed>  $data
     * @param  array{ip?: ?string, origin?: ?string, user_agent?: ?string}  $meta
     */
    public function execute(Form $form, array $data, array $meta = []): FormSubmission
    {
        abort_if($form->destinations === [], 422, 'This form has no destinations configured.');
        abort_if($form->confirmedDestinations() === [], 422, 'This form has no confirmed destination yet.');
        abort_unless(Setting::where('key', 'smtp')->exists(), 503, 'Email delivery is not configured.');

        abort_if(
            AccountQuotas::dailyReached($form),
            response()->json(['message' => 'This form reached its limit of messages for today. Try again tomorrow.', 'code' => 'daily_limit'], 429),
        );

        $submission = $this->storeSubmission->execute($form, $data, $meta);

        SendFormSubmission::dispatch($submission);

        return $submission;
    }
}
