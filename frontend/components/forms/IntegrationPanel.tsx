"use client";

import { useEffect, useState } from "react";
import type { Form } from "@/lib/api";
import { apiPublicUrl } from "@/lib/config";
import { ActionButton } from "../Button";
import { Card, CardHeader } from "../ui/Card";
import { CodeBlock, CopyBox } from "../ui/CodeBlock";
import { htmlForm } from "./snippets";

export function EmbedPanel({ form, onOpenDelivery }: { form: Form; onOpenDelivery: () => void }) {
  const [base, setBase] = useState("");

  useEffect(() => setBase(apiPublicUrl()), []);

  const endpoint = `${base}/api/forms/${form.code}/submit`;

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Embed" />

      <div className="px-5 pb-6 sm:px-6">
        <CopyBox id="endpoint" prefix="POST" value={endpoint} />

        {/* A plain form shows the visitor whatever comes back: a JSON page, unless the form redirects. */}
        {form.response_type !== "redirect" && (
          <div className="mt-5 flex flex-col gap-3 rounded-control border border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base leading-relaxed">Visitors will see a JSON answer after sending. Choose Redirect so they land on your thank-you page.</p>
            <ActionButton type="button" variant="ghost" className="w-full sm:w-auto" onClick={onOpenDelivery}>
              Go to Delivery
            </ActionButton>
          </div>
        )}

        <div className="mt-6">
          <CodeBlock language="HTML" code={htmlForm(form, endpoint)} />
        </div>
      </div>
    </Card>
  );
}
