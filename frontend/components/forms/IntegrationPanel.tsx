"use client";

import { useEffect, useState } from "react";
import { apiPublicUrl } from "@/lib/config";
import type { Form } from "@/lib/api";
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

/** Roughly how tall the form is, so the frame needs no scrollbar for most forms. */
function frameHeight(form: Form): number {
  const rows = form.fields.reduce((total, field) => total + (field.type === "textarea" ? 190 : 96), 0);
  return Math.max(320, Math.round((rows + 120) / 10) * 10);
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
