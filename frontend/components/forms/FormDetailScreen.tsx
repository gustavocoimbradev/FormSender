"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, deleteForm, getForm, type Form } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { CardSkeleton, CardUnreachable } from "../CardStates";
import { ChevronIcon } from "../icons";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { Pills } from "../ui/Pills";
import { useToast } from "../ui/Toast";
import { FormsIcon } from "../icons";
import { FormEditor } from "./FormEditor";
import { IntegrationPanel } from "./IntegrationPanel";
import { SubmissionsPanel } from "./SubmissionsPanel";
import { TestPanel } from "./TestPanel";

type Tab = "config" | "integration" | "messages" | "test";

const TABS: { id: Tab; label: string }[] = [
  { id: "config", label: "Configuração" },
  { id: "integration", label: "Integração" },
  { id: "messages", label: "Mensagens" },
  { id: "test", label: "Testar formulário" },
];

export const BackLink = () => (
  <Link href="/forms" className="mb-2 inline-flex min-h-11 items-center gap-1 text-base text-muted transition-colors duration-300 hover:text-text">
    <ChevronIcon className="size-5 rotate-180" /> Formulários
  </Link>
);

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
      toast("Formulário excluído.");
      router.push("/forms");
    } catch {
      toast("Não foi possível excluir.", "error");
      setDeleting(false);
    }
  }

  if (error) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <>
        <BackLink />
        <Card className="p-8">
          {missing ? <EmptyState icon={<FormsIcon />} title="Formulário não encontrado" text="Ele pode ter sido excluído." /> : <CardUnreachable onRetry={reload} />}
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

      <div className="mb-6">
        <Pills label="Seções do formulário" value={tab} options={TABS} onChange={setTab} />
      </div>

      <div key={tab}>
        {tab === "config" && <FormEditor form={current} onSaved={setForm} onDelete={() => setConfirming(true)} />}
        {tab === "integration" && <IntegrationPanel form={current} />}
        {tab === "test" && <TestPanel form={current} onOpenMessages={() => setTab("messages")} onOpenConfig={() => setTab("config")} />}
        {tab === "messages" && <SubmissionsPanel form={current} />}
      </div>

      <ConfirmDialog
        open={confirming}
        title="Excluir formulário?"
        message="O formulário deixa de funcionar e o token é descartado. As mensagens já recebidas continuam guardadas para consulta."
        confirmLabel="Excluir formulário"
        onConfirm={() => void remove()}
        onClose={() => setConfirming(false)}
        busy={deleting}
        danger
      />
    </>
  );
}
