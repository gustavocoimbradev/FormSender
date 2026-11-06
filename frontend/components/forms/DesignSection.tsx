"use client";

import { useState } from "react";
import { getDefaultStyle } from "@/lib/api";
import { ActionButton } from "../Button";
import { CodeEditor } from "../email/CodeEditor";
import { RefreshIcon } from "../icons";
import { Card, CardHeader } from "../ui/Card";
import { Pills } from "../ui/Pills";
import { useToast } from "../ui/Toast";
import { FormPreview } from "./FormPreview";

type DesignSectionProps = {
  code: string;
  css: string;
  error?: string;
  disabled: boolean;
  onChange: (css: string) => void;
};

const THEMES = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

/** The look of the embedded form: the form itself, and the CSS that draws it, written here and ready to edit. */
export function DesignSection({ code, css, error, disabled, onChange }: DesignSectionProps) {
  const toast = useToast();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [restoring, setRestoring] = useState(false);

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

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
      <Card className="min-w-0 animate-fade-up">
        <CardHeader title="Style">
          <ActionButton type="button" variant="ghost" loading={restoring} disabled={disabled} onClick={() => void restore()}>
            <RefreshIcon className="size-5" /> Restore default style
          </ActionButton>
        </CardHeader>

        <div className="px-5 pb-6 sm:px-6">
          <CodeEditor value={css} onChange={onChange} label="Form style (CSS)" language="css" height="h-[32rem]" />

          <p aria-live="polite" className="mt-2 text-base text-danger">
            {error}
          </p>
        </div>
      </Card>

      <Card className="min-w-0 animate-fade-up">
        <CardHeader title="Preview">
          <Pills label="Preview colors" value={theme} options={[...THEMES]} onChange={setTheme} />
        </CardHeader>

        <div className="px-5 pb-6 sm:px-6">
          <FormPreview code={code} theme={theme} css={css} />
        </div>
      </Card>
    </div>
  );
}
