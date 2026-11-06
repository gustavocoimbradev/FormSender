"use client";

import { useMemo, useRef, useState } from "react";
import { getDefaultEmail, type FormField } from "@/lib/api";
import { ActionButton } from "../Button";
import { CodeEditor, VARIABLES } from "../email/CodeEditor";
import { EmailPreview } from "../email/EmailPreview";
import { Field } from "../Field";
import { RefreshIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/Toast";

type EmailSectionProps = {
  subject: string;
  html: string;
  /** The fields being edited, so the preview shows example answers for them. */
  fields: FormField[];
  errors: { subject?: string; html?: string };
  disabled: boolean;
  onChange: (changes: { emailSubject?: string; emailHtml?: string }) => void;
};

/** The email delivered for this form's messages: written here, next to the form it belongs to, with a live preview. */
export function EmailSection({ subject, html, fields, errors, disabled, onChange }: EmailSectionProps) {
  const toast = useToast();
  const insert = useRef<((text: string) => void) | null>(null);
  const [resetting, setResetting] = useState(false);

  // A field with no label or name yet cannot be drawn: it joins the preview once it has both.
  const previewFields = useMemo(
    () => fields.filter((field) => field.name && field.label.trim()).map((field) => ({ name: field.name, label: field.label.trim(), type: field.type, ...(field.type === "select" ? { options: field.options ?? [] } : {}) })),
    [fields],
  );

  async function reset() {
    setResetting(true);
    try {
      const standard = await getDefaultEmail();
      onChange({ emailSubject: standard.subject, emailHtml: standard.html });
      toast("Back to the default email. Save to keep it.");
    } catch {
      toast("Could not load the default email. Please try again.", "error");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
      <Card className="min-w-0 animate-fade-up">
        <CardHeader title="Email">
          <ActionButton type="button" variant="ghost" loading={resetting} disabled={disabled} onClick={() => void reset()}>
            <RefreshIcon className="size-5" /> Reset to default
          </ActionButton>
        </CardHeader>

        <div className="px-5 pb-6 sm:px-6">
          <Field
            id="email-subject"
            label="Subject"
            value={subject}
            onChange={(event) => onChange({ emailSubject: event.target.value })}
            error={errors.subject}
            disabled={disabled}
            placeholder="New message: {{form_name}}"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Insert variable">
            {VARIABLES.map((variable) => (
              <button
                key={variable.label}
                type="button"
                title={variable.detail}
                onClick={() => insert.current?.(variable.label)}
                className="min-h-11 rounded-full bg-surface/[0.08] px-4 font-mono text-base text-text transition-colors duration-300 hover:bg-accent/25"
              >
                {variable.label}
              </button>
            ))}
          </div>

          <CodeEditor value={html} onChange={(emailHtml) => onChange({ emailHtml })} insertRef={insert} label="Email HTML" />

          <p aria-live="polite" className="mt-2 text-base text-danger">
            {errors.html}
          </p>
        </div>
      </Card>

      <Card className="min-w-0 animate-fade-up">
        <CardHeader title="Preview" />
        <div className="px-5 pb-6 sm:px-6">
          <EmailPreview subject={subject} html={html} fields={previewFields} />
        </div>
      </Card>
    </div>
  );
}
