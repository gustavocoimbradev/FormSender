"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, deleteTemplate, getTemplate, listTemplates, type Template } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { CardSkeleton, CardUnreachable } from "../CardStates";
import { ChevronIcon, TemplateIcon } from "../icons";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { useToast } from "../ui/Toast";
import { TemplateEditor } from "./TemplateEditor";

const BackLink = () => (
  <Link href="/templates" className="mb-2 inline-flex min-h-11 items-center gap-1 text-base text-muted transition-colors duration-300 hover:text-text">
    <ChevronIcon className="size-5 rotate-180" /> Templates
  </Link>
);

/** A new template starts as a copy of the default one, so there is always something good to change. */
export function NewTemplateScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useResource(listTemplates, []);
  const base = data?.find((template) => template.is_default);

  return (
    <>
      <PageHeader title="New template" back={<BackLink />} />
      {error ? (
        <Card className="p-8">
          <CardUnreachable onRetry={reload} />
        </Card>
      ) : loading || !base ? (
        <Card className="p-8">
          <CardSkeleton rows={3} />
        </Card>
      ) : (
        <TemplateEditor initial={{ subject: base.subject, html: base.html }} onSaved={(template) => router.push(`/templates/${template.code}`)} />
      )}
    </>
  );
}

export function TemplateDetailScreen({ code }: { code: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data, loading, error, reload } = useResource(() => getTemplate(code), [code]);
  const [saved, setSaved] = useState<Template>();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const current = saved ?? data;

  async function remove() {
    if (!current) return;
    setDeleting(true);
    try {
      await deleteTemplate(current.code);
      toast("Template deleted.");
      router.push("/templates");
    } catch {
      toast("Could not delete.", "error");
      setDeleting(false);
    }
  }

  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <>
        <BackLink />
        <Card className="p-8">
          {missing ? <EmptyState icon={<TemplateIcon />} title="Template not found" text="It may have been deleted." /> : <CardUnreachable onRetry={reload} />}
        </Card>
      </>
    );
  }

  if (loading && !current) {
    return (
      <>
        <BackLink />
        <Card className="p-8">
          <CardSkeleton rows={3} />
        </Card>
      </>
    );
  }

  if (!current) return null;

  return (
    <>
      <PageHeader title={current.name} back={<BackLink />} />
      <TemplateEditor template={current} onSaved={setSaved} onDelete={current.is_default ? undefined : () => setConfirming(true)} />

      <ConfirmDialog
        open={confirming}
        title="Delete template?"
        message="Forms that use this template go back to the default one."
        confirmLabel="Delete template"
        onConfirm={() => void remove()}
        onClose={() => setConfirming(false)}
        busy={deleting}
        danger
      />
    </>
  );
}
