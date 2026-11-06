"use client";

import { useState, type FormEvent } from "react";
import { ApiError, saveQuotas, type QuotaLimits } from "@/lib/api";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/Toast";

type Errors = { forms?: string; daily?: string };

const MAX = 1_000_000;

/** Empty means unlimited. Anything else has to be a whole number from 1. */
function parse(value: string): { limit: number | null; error?: string } {
  const text = value.trim();
  if (text === "") return { limit: null };
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > MAX) return { limit: null, error: "Enter a whole number from 1, or leave it empty for no limit." };

  return { limit: Number(text) };
}

const show = (limit: number | null) => (limit === null ? "" : String(limit));

/** How many forms an account can have and how many messages its forms can receive in a day. */
export function QuotasTab({ quotas }: { quotas: QuotaLimits }) {
  const toast = useToast();
  const [forms, setForms] = useState(show(quotas.max_forms));
  const [daily, setDaily] = useState(show(quotas.max_daily_submissions));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    const parsedForms = parse(forms);
    const parsedDaily = parse(daily);
    setErrors({ forms: parsedForms.error, daily: parsedDaily.error });
    if (parsedForms.error || parsedDaily.error) return;

    setSaving(true);
    try {
      const saved = await saveQuotas({ max_forms: parsedForms.limit, max_daily_submissions: parsedDaily.limit });
      setForms(show(saved.max_forms));
      setDaily(show(saved.max_daily_submissions));
      toast("Limits saved.");
    } catch (failure) {
      toast(failure instanceof ApiError && failure.status === 422 ? "Check the numbers." : "Could not save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Limits for each account" />

      <div className="px-5 pb-6 sm:px-6">
        <p className="mb-4 text-base text-muted">They apply to the users, never to you, the administrator. Leave a limit empty for no limit.</p>

        <form onSubmit={submit} noValidate>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field
              id="max-forms"
              label="Forms"
              value={forms}
              onChange={(event) => setForms(event.target.value)}
              error={errors.forms}
              disabled={saving}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Unlimited"
              hint="How many forms one account can have."
            />
            <Field
              id="max-daily"
              label="Messages per day"
              value={daily}
              onChange={(event) => setDaily(event.target.value)}
              error={errors.daily}
              disabled={saving}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Unlimited"
              hint="How many messages the forms of one account can receive in a day. After that, visitors are told the limit was reached."
            />
          </div>

          <div className="mt-2 flex justify-end">
            <ActionButton type="submit" loading={saving} className="h-14 w-full px-8 sm:w-auto">
              Save
            </ActionButton>
          </div>
        </form>
      </div>
    </Card>
  );
}
