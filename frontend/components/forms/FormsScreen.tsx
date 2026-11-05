"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { listForms, type Form } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import { useResource } from "@/lib/hooks";
import { ActionLink } from "../Button";
import { CardUnreachable } from "../CardStates";
import { FormsIcon, PlusIcon } from "../icons";
import { Card } from "../ui/Card";
import { DataTable, type Column } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { Pagination } from "../ui/Pagination";

const COLUMNS: Column<Form>[] = [
  { id: "name", header: "Nome", primary: true, cell: (form) => <span className="font-medium">{form.name}</span> },
  { id: "fields", header: "Campos", cell: (form) => plural(form.fields.length, "campo", "campos"), className: "whitespace-nowrap" },
  { id: "destinations", header: "Destinos", cell: (form) => plural(form.destinations.length, "destino", "destinos"), className: "whitespace-nowrap" },
  {
    id: "domains",
    header: "Sites permitidos",
    cell: (form) => (form.allowed_domains.length === 0 ? <span className="text-muted">Qualquer site</span> : plural(form.allowed_domains.length, "site", "sites")),
    className: "whitespace-nowrap",
  },
  { id: "created", header: "Criado em", cell: (form) => <span className="text-muted">{formatDate(form.created_at)}</span>, className: "whitespace-nowrap" },
];

export function FormsScreen() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useResource(() => listForms(page), [page]);

  const newForm = (
    <ActionLink href="/forms/new">
      <PlusIcon /> Novo formulário
    </ActionLink>
  );

  return (
    <>
      <PageHeader title="Formulários">{newForm}</PageHeader>

      <Card className="animate-fade-up overflow-hidden">
        {error ? (
          <div className="p-8">
            <CardUnreachable onRetry={reload} />
          </div>
        ) : (
          <>
            <DataTable
              columns={COLUMNS}
              rows={data?.data ?? []}
              getKey={(form) => form.code}
              onRowClick={(form) => router.push(`/forms/${form.code}`)}
              loading={loading && !data}
              empty={<EmptyState icon={<FormsIcon />} title="Nenhum formulário ainda" text="Crie o primeiro e use o endereço dele no seu site." action={newForm} />}
            />
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </>
        )}
      </Card>
    </>
  );
}
