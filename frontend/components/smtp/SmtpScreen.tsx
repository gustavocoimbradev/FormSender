"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, getSmtp, saveSmtp } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { defaultSmtpDraft, draftFromSettings, isSmtpReady, settingsFromDraft, smtpErrorsFromApi, type SmtpDraft, type SmtpErrors } from "@/lib/smtp";
import { ActionButton } from "../Button";
import { CardSkeleton, CardUnreachable } from "../CardStates";
import { SmtpFields } from "../SmtpFields";
import { Card, CardHeader } from "../ui/Card";
import { PageHeader } from "../ui/PageHeader";
import { useToast } from "../ui/Toast";

export function SmtpScreen() {
  const toast = useToast();
  const { data, loading, error, reload } = useResource(getSmtp, []);
  const [draft, setDraft] = useState<SmtpDraft>(defaultSmtpDraft);
  const [errors, setErrors] = useState<SmtpErrors>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Starts from what is saved (or the default when nothing is).
  useEffect(() => {
    if (loading || error) return;
    setDraft(data ? draftFromSettings(data) : defaultSmtpDraft());
    setLoaded(true);
  }, [data, loading, error]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!isSmtpReady(draft)) {
      toast("Check the server, port and sender.", "error");
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      const saved = await saveSmtp(settingsFromDraft(draft));
      if (saved) setDraft(draftFromSettings(saved));
      toast("Settings saved.");
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 422) {
        setErrors(smtpErrorsFromApi(failure.fieldErrors));
        toast("Check the highlighted fields.", "error");
      } else {
        toast("Could not save. Please try again.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="SMTP" />

      <Card className="animate-fade-up">
        <CardHeader title="Email server" />

        <div className="px-5 pb-6 sm:px-6">
          {error ? (
            <CardUnreachable onRetry={reload} />
          ) : !loaded ? (
            <CardSkeleton rows={4} />
          ) : (
            <form onSubmit={submit} noValidate>
              <SmtpFields draft={draft} onChange={setDraft} errors={errors} disabled={saving} />

              <div className="mt-2 flex justify-end">
                <ActionButton type="submit" loading={saving} disabled={!isSmtpReady(draft)} className="h-14 w-full px-8 sm:w-auto">
                  Save
                </ActionButton>
              </div>
            </form>
          )}
        </div>
      </Card>
    </>
  );
}
