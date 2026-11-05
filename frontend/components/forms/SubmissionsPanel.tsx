"use client";

import { useState } from "react";
import { listSubmissions, type Form, type Submission, type SubmissionStatus } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { useResource } from "@/lib/hooks";
import { CardUnreachable } from "../CardStates";
import { InboxIcon } from "../icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { DataTable, type Column } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { Modal } from "../ui/Modal";
import { Pagination } from "../ui/Pagination";
import { Select } from "../ui/Select";

type Filter = "all" | SubmissionStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendentes" },
  { id: "processing", label: "Enviando" },
  { id: "sent", label: "Enviadas" },
  { id: "partial", label: "Parciais" },
  { id: "failed", label: "Com falha" },
];

const STATUS: Record<SubmissionStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }> = {
  pending: { label: "Pendente", tone: "neutral" },
  processing: { label: "Enviando", tone: "accent" },
  sent: { label: "Enviada", tone: "success" },
  partial: { label: "Parcial", tone: "warning" },
  failed: { label: "Falhou", tone: "danger" },
};

const DELIVERY: Record<string, { label: string; tone: "neutral" | "success" | "danger" }> = {
  pending: { label: "Pendente", tone: "neutral" },
  sent: { label: "Entregue", tone: "success" },
  failed: { label: "Falhou", tone: "danger" },
};

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, tone } = STATUS[status];
  return <Badge tone={tone}>{label}</Badge>;
}

function summary(submission: Submission): string {
  const first = Object.values(submission.values).find((value) => typeof value === "string" && value.length > 0);
  return typeof first === "string" ? (first.length > 48 ? `${first.slice(0, 48)}…` : first) : "–";
}

export function SubmissionsPanel({ form }: { form: Form }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Submission>();
  const { data, loading, error, reload } = useResource(() => listSubmissions(form.code, page, filter === "all" ? undefined : filter), [form.code, page, filter]);

  const labels = new Map(form.fields.map((field) => [field.name, field.label]));

  const columns: Column<Submission>[] = [
    { id: "received", header: "Recebida em", primary: true, cell: (item) => <span className="font-medium">{formatDateTime(item.created_at)}</span>, className: "whitespace-nowrap" },
    { id: "status", header: "Status", cell: (item) => <StatusBadge status={item.status} />, className: "whitespace-nowrap" },
    { id: "summary", header: "Mensagem", cell: (item) => <span className="text-muted">{summary(item)}</span> },
    {
      id: "deliveries",
      header: "Entregas",
      cell: (item) => `${item.deliveries.filter((delivery) => delivery.status === "sent").length}/${item.deliveries.length}`,
      className: "whitespace-nowrap",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="max-w-xs">
        <Select
          id="status-filter"
          label="Status"
          value={filter}
          options={FILTERS.map(({ id, label }) => ({ value: id, label }))}
          onChange={(next) => {
            setFilter(next);
            setPage(1);
          }}
        />
      </div>

      <Card className="animate-fade-up overflow-hidden">
        {error ? (
          <div className="p-8">
            <CardUnreachable onRetry={reload} />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.data ?? []}
              getKey={(item) => item.id}
              onRowClick={setOpen}
              loading={loading && !data}
              empty={<EmptyState icon={<InboxIcon />} title="Nenhuma mensagem" text={filter === "all" ? "Quando alguém enviar este formulário, a mensagem aparece aqui." : "Nenhuma mensagem com esse status."} />}
            />
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </>
        )}
      </Card>

      <Modal open={open !== undefined} title="Mensagem" onClose={() => setOpen(undefined)} size="lg">
        {open && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={open.status} />
              <span className="text-base text-muted">Recebida em {formatDateTime(open.created_at)}</span>
            </div>

            <section>
              <h3 className="mb-3 text-lg font-semibold">Conteúdo</h3>
              <dl className="divide-y divide-surface/10 rounded-control border border-surface/10">
                {Object.entries(open.values).map(([name, value]) => (
                  <div key={name} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                    <dt className="text-base text-muted">{labels.get(name) ?? name}</dt>
                    <dd className="break-words text-base">{typeof value === "boolean" ? (value ? "Sim" : "Não") : String(value)}</dd>
                  </div>
                ))}
                {Object.keys(open.values).length === 0 && <p className="px-4 py-3 text-base text-muted">Sem conteúdo.</p>}
              </dl>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-semibold">Entrega</h3>
              <ul className="divide-y divide-surface/10 rounded-control border border-surface/10">
                {open.deliveries.map((delivery) => (
                  <li key={delivery.destination} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="break-all text-base">{delivery.destination}</p>
                      {delivery.error && <p className="text-base text-danger">{delivery.error}</p>}
                      {delivery.sent_at && <p className="text-base text-muted">Entregue em {formatDateTime(delivery.sent_at)}</p>}
                    </div>
                    <Badge tone={DELIVERY[delivery.status].tone}>{DELIVERY[delivery.status].label}</Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-base text-muted">
                {open.attempts} {open.attempts === 1 ? "tentativa" : "tentativas"}
                {open.error ? ` · ${open.error}` : ""}
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-lg font-semibold">Origem</h3>
              <dl className="grid gap-2 text-base sm:grid-cols-[10rem_1fr]">
                <dt className="text-muted">Site</dt>
                <dd className="break-all">{open.origin ?? "–"}</dd>
                <dt className="text-muted">IP</dt>
                <dd>{open.ip ?? "–"}</dd>
                <dt className="text-muted">Navegador</dt>
                <dd className="break-words">{open.user_agent || "–"}</dd>
              </dl>
            </section>
          </div>
        )}
      </Modal>
    </div>
  );
}
