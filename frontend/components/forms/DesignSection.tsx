"use client";

import { useState } from "react";
import { getDefaultStyle } from "@/lib/api";
import { formatCss } from "@/lib/formatCss";
import { ActionButton } from "../Button";
import { CodeEditor } from "../email/CodeEditor";
import { RefreshIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { useToast } from "../ui/Toast";
import { FormPreview } from "./FormPreview";

type DesignSectionProps = {
  code: string;
  css: string;
  error?: string;
  disabled: boolean;
  onChange: (css: string) => void;
};

/** The look of the embedded form: the form itself, and the CSS that draws it, written here and ready to edit. */
export function DesignSection({ code, css, error, disabled, onChange }: DesignSectionProps) {
  const toast = useToast();
  const [restoring, setRestoring] = useState(false);
  const [formatting, setFormatting] = useState(false);

  async function restore() {
    setRestoring(true);
    try {
      onChange(await getDefaultStyle());
      toast("Back to the default style. Save to keep it.");
    } catch {
      toast("Could not load the default style. Please try again.", "error");
    } finally {
      setRestoring(false);
    }
  }

  async function format() {
    setFormatting(true);
    try {
      onChange(await formatCss(css));
    } catch {
      toast("Could not tidy the style. Check it for a missing brace or semicolon.", "error");
    } finally {
      setFormatting(false);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
      <Card className="min-w-0 animate-fade-up">
        <CardHeader title="Style">
          <div className="flex flex-wrap gap-2">
            <ActionButton type="button" variant="ghost" loading={formatting} disabled={disabled || restoring} onClick={() => void format()} title="Shift+Alt+F">
              Format
            </ActionButton>
            <ActionButton type="button" variant="ghost" loading={restoring} disabled={disabled || formatting} onClick={() => void restore()}>
              <RefreshIcon className="size-5" /> Restore default style
            </ActionButton>
          </div>
        </CardHeader>

        <div className="px-5 pb-6 sm:px-6">
          <CodeEditor value={css} onChange={onChange} label="Form style (CSS)" language="css" height="h-[32rem]" onFormat={() => void format()} />

          <p aria-live="polite" className="mt-2 text-base text-danger">
            {error}
          </p>
        </div>
      </Card>

      <Card className="min-w-0 animate-fade-up">
        <CardHeader title="Preview" />

        <div className="px-5 pb-6 sm:px-6">
          <FormPreview code={code} css={css} />
          <p className="mt-3 text-base text-muted">Point at any part of the form to see its selector.</p>
        </div>
      </Card>
    </div>
  );
}
