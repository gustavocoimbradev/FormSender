"use client";

import { useState } from "react";
import { getDefaultStrings } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { ActionButton } from "../Button";
import { CardUnreachable } from "../CardStates";
import { Field } from "../Field";
import { RefreshIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/Toast";

type StringsSectionProps = {
  strings: Record<string, string>;
  error?: string;
  disabled: boolean;
  onChange: (strings: Record<string, string>) => void;
};

/** The texts the embedded form shows by itself (the send button, the notices, the messages about a field), ready to edit. */
export function StringsSection({ strings, error, disabled, onChange }: StringsSectionProps) {
  const toast = useToast();
  const defaults = useResource(getDefaultStrings, []);
  const [restoring, setRestoring] = useState(false);

  async function restore() {
    setRestoring(true);
    try {
      const all = defaults.data ?? (await getDefaultStrings());
      onChange(Object.fromEntries(all.map((item) => [item.key, item.text])));
      toast("Back to the default texts. Save to keep them.");
    } catch {
      toast("Could not load the default texts. Please try again.", "error");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Texts">
        <ActionButton type="button" variant="ghost" loading={restoring} disabled={disabled} onClick={() => void restore()}>
          <RefreshIcon className="size-5" /> Restore default texts
        </ActionButton>
      </CardHeader>

      <div className="px-5 pb-2 sm:px-6">
        {defaults.error ? (
          <div className="pb-6">
            <CardUnreachable onRetry={defaults.reload} />
          </div>
        ) : (
          <div className="grid gap-x-4 lg:grid-cols-2">
            {(defaults.data ?? []).map((item) => (
              <Field
                key={item.key}
                id={`string-${item.key}`}
                label={item.description}
                value={strings[item.key] ?? item.text}
                onChange={(event) => onChange({ ...strings, [item.key]: event.target.value })}
                placeholder={item.text}
                maxLength={200}
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
              />
            ))}
          </div>
        )}

        <p aria-live="polite" className="mb-4 text-base text-danger">
          {error}
        </p>
        <p className="mb-4 text-base text-muted">Leave a text empty to use the default words.</p>
      </div>
    </Card>
  );
}
