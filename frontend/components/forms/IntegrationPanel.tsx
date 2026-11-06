"use client";

import { useEffect, useState } from "react";
import { apiPublicUrl } from "@/lib/config";
import type { FieldType, Form } from "@/lib/api";
import { Card, CardHeader } from "../ui/Card";
import { CodeBlock } from "../ui/CodeBlock";
import { Select } from "../ui/Select";

type Way = "script" | "iframe";

const WAYS: { value: Way; label: string }[] = [
  { value: "script", label: "Script" },
  { value: "iframe", label: "Iframe" },
];

const HINTS: Record<Way, string> = {
  script: "Paste this where the form should appear. It always shows the fields you have here.",
  iframe: "For pages that do not allow scripts. It shows the same form, in its own frame. Add ?theme=dark to the address for dark sites.",
};

/** Height of each kind of field in the framed form (label, control and the space under it), measured on the real page. */
const FIELD_HEIGHT: Partial<Record<FieldType, number>> = { textarea: 168, checkbox: 60, file: 98 };

/** What is under the fields: the Send button, our credit and the page's margin. */
const FRAME_REST = 104;

/** How tall the framed form is, so the frame ends right under it: no empty space and, for most forms, no scrollbar. */
function frameHeight(form: Form): number {
  return Math.max(180, form.fields.reduce((total, field) => total + (FIELD_HEIGHT[field.type] ?? 96), FRAME_REST));
}

export function IntegrationPanel({ form }: { form: Form }) {
  const [api, setApi] = useState("");
  const [panel, setPanel] = useState("");
  const [way, setWay] = useState<Way>("script");

  useEffect(() => {
    setApi(apiPublicUrl());
    setPanel(window.location.origin);
  }, []);

  const code =
    way === "script"
      ? `<script src="${api}/embed.js" data-form="${form.code}" async></script>`
      : `<iframe src="${panel}/f/${form.code}" width="100%" height="${frameHeight(form)}" style="border:0" loading="lazy"></iframe>`;

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Integration" />

      <div className="px-5 pb-6 sm:px-6">
        <div className="mb-4">
          <Select id="integration-way" label="Add it with" value={way} options={WAYS} onChange={setWay} />
        </div>

        <p className="mb-5 text-base leading-relaxed text-muted">{HINTS[way]}</p>

        <CodeBlock language="HTML" code={code} />
      </div>
    </Card>
  );
}
