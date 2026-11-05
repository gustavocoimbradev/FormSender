"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, deleteTemplate, getTemplate, listTemplates, type Template } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { CardUnreachable } from "../CardStates";
import { Bar, FieldsRow, FormCardSkeleton } from "../ui/Skeleton";
import { ChevronIcon, TemplateIcon } from "../icons";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { useToast } from "../ui/Toast";
import { TemplateEditor } from "./TemplateEditor";

/** The template editor while it loads: the general card, then the code box next to the preview. */
function EditorSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <FormCardSkeleton>
        <FieldsRow count={2} grid="sm:grid-cols-2" />
      </FormCardSkeleton>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-2">
        <FormCardSkeleton>
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: 7 }, (_, index) => (
              <Bar key={index} className="h-11 w-28 rounded-full" />
            ))}
          </div>
          <Bar className="mb-4 h-[34rem] rounded-control" />
        </FormCardSkeleton>
        <FormCardSkeleton>
          <Bar className="mb-4 h-11 w-52 rounded-full" />
          <Bar className="mb-3 h-5 w-2/3 rounded-full" />
          <Bar className="mb-4 h-[34rem] rounded-control" />
        </FormCardSkeleton>
      </div>
    </div>
  );
}

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
        <EditorSkeleton />
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
        <PageHeader title={null} back={<BackLink />} />
        <EditorSkeleton />
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
