"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, deleteForm, getForm, type Form } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { CardUnreachable } from "../CardStates";
import { ListSkeleton } from "../ui/DataTable";
import { Bar, FieldSkeleton, FormCardSkeleton, PillsSkeleton } from "../ui/Skeleton";
import { ChevronIcon } from "../icons";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { Pills } from "../ui/Pills";
import { useToast } from "../ui/Toast";
import { FormsIcon } from "../icons";
import { FormEditor } from "./FormEditor";
import { EmbedPanel } from "./EmbedPanel";
import { SubmissionsPanel } from "./SubmissionsPanel";
import { TestPanel } from "./TestPanel";

type Tab = "general" | "fields" | "delivery" | "embed" | "messages" | "test";

const EDITOR_TABS: Tab[] = ["general", "fields", "delivery"];

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "fields", label: "Fields" },
  { id: "delivery", label: "Delivery" },
  { id: "embed", label: "Embed" },
  { id: "messages", label: "Messages" },
  { id: "test", label: "Test form" },
];

export const BackLink = () => (
  <Link href="/forms" className="mb-2 inline-flex min-h-11 items-center gap-1 text-base text-muted transition-colors duration-300 hover:text-text">
    <ChevronIcon className="size-5 rotate-180" /> Forms
  </Link>
);

/** What the opened tab looks like, so the page does not change shape when the form arrives. */
function TabSkeleton({ tab }: { tab: Tab }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      {tab === "general" && (
        <FormCardSkeleton>
          <FieldSkeleton />
          <FieldSkeleton />
        </FormCardSkeleton>
      )}

      {tab === "fields" && (
        <FormCardSkeleton>
          <Bar className="mb-3 h-[4.5rem] rounded-control" />
          <Bar className="mb-3 h-[4.5rem] rounded-control" />
          <Bar className="mb-5 h-11 rounded-control" />
        </FormCardSkeleton>
      )}

      {tab === "delivery" && (
        <FormCardSkeleton>
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </FormCardSkeleton>
      )}

      {tab === "embed" && (
        <FormCardSkeleton>
          <Bar className="mb-5 h-[3.125rem] rounded-control" />
          <Bar className="mb-2 h-6 w-40 rounded-full" />
          <Bar className="mb-5 h-40 rounded-control" />
          <FieldSkeleton width="w-24" />
          <Bar className="mb-5 h-72 rounded-control" />
        </FormCardSkeleton>
      )}

      {tab === "messages" && (
        <>
          <div className="sm:max-w-xs">
            <FieldSkeleton width="w-14" />
          </div>
          <Card className="overflow-hidden">
            <ListSkeleton
              columns={[
                { id: "received", header: "Received", className: "whitespace-nowrap" },
                { id: "status", header: "Status", className: "whitespace-nowrap" },
                { id: "summary", header: "Message" },
                { id: "deliveries", header: "Deliveries", className: "whitespace-nowrap" },
              ]}
            />
          </Card>
        </>
      )}

      {tab === "test" && (
        <FormCardSkeleton>
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <Bar className="mb-4 h-14 rounded-control" />
        </FormCardSkeleton>
      )}
    </div>
  );
}

export function FormDetailScreen({ code, initialTab }: { code: string; initialTab: Tab }) {
  const router = useRouter();
  const toast = useToast();
  const { data, loading, error, reload } = useResource(() => getForm(code), [code]);
  const [form, setForm] = useState<Form>();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const current = form ?? data;

  async function remove() {
    if (!current) return;
    setDeleting(true);
    try {
      await deleteForm(current.code);
      toast("Form deleted.");
      router.push("/forms");
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
          {missing ? <EmptyState icon={<FormsIcon />} title="Form not found" text="It may have been deleted." /> : <CardUnreachable onRetry={reload} />}
        </Card>
      </>
    );
  }

  if (loading && !current) {
    return (
      <>
        <PageHeader title={null} back={<BackLink />} />
        <PillsSkeleton />
        <TabSkeleton tab={tab} />
      </>
    );
  }

  if (!current) return null;

  return (
    <>
      <PageHeader title={current.name} back={<BackLink />} />

      <div className="mb-6">
        <Pills label="Form sections" value={tab} options={TABS} onChange={setTab} />
      </div>

      {/* The three editing tabs share one editor, so what was typed stays while moving between them. */}
      <div key={EDITOR_TABS.includes(tab) ? "editor" : tab}>
        {EDITOR_TABS.includes(tab) && <FormEditor form={current} section={tab as "general" | "fields" | "delivery"} onSectionChange={setTab} onSaved={setForm} onDelete={() => setConfirming(true)} />}
        {tab === "embed" && <EmbedPanel form={current} onOpenDelivery={() => setTab("delivery")} />}
        {tab === "test" && <TestPanel form={current} onOpenMessages={() => setTab("messages")} onOpenConfig={() => setTab("fields")} />}
        {tab === "messages" && <SubmissionsPanel form={current} />}
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete form?"
        message="The form stops working and its code is discarded. Messages already received are kept for reference."
        confirmLabel="Delete form"
        onConfirm={() => void remove()}
        onClose={() => setConfirming(false)}
        busy={deleting}
        danger
      />
    </>
  );
}
