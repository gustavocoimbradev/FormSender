"use client";

import { useEffect, useState } from "react";
import type { Form } from "@/lib/api";
import { apiPublicUrl } from "@/lib/config";
import { Card, CardHeader } from "../ui/Card";
import { CodeBlock, CopyBox } from "../ui/CodeBlock";
import { BrandIcon } from "../ui/BrandIcon";
import { Select } from "../ui/Select";
import { TARGETS, sample } from "./snippets";

const STORAGE_KEY = "formsender.snippet";

export function IntegrationPanel({ form }: { form: Form }) {
  const [base, setBase] = useState("");
  const [targetId, setTargetId] = useState(TARGETS[0].id);

  useEffect(() => {
    setBase(apiPublicUrl());

    // Remembers the last choice on this browser.
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && TARGETS.some((target) => target.id === saved)) setTargetId(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function choose(id: string) {
    setTargetId(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable */
    }
  }

  const endpoint = `${base}/api/forms/${form.code}/submit`;
  const target = TARGETS.find((candidate) => candidate.id === targetId) ?? TARGETS[0];

  return (
    <Card className="animate-fade-up">
      <CardHeader title="How to use" />

      <div className="px-5 pb-6 sm:px-6">
        <CopyBox id="endpoint" prefix="POST" value={endpoint} />

        <span className="mb-2 mt-6 block text-base font-medium">Request body</span>
        <CodeBlock id="request-body" language="JSON" code={JSON.stringify(sample(form), null, 2)} flush />

        <div className="mt-6">
          <Select id="snippet-language" label="Language" value={targetId} options={TARGETS.map(({ id, label }) => ({ value: id, label, icon: <BrandIcon id={id} /> }))} onChange={choose} />
        </div>

        <CodeBlock key={target.id} language={target.label} code={target.code(form, endpoint)} />
      </div>
    </Card>
  );
}
