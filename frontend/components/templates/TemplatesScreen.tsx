"use client";

import { useRouter } from "next/navigation";
import { listTemplates, type Template } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import { useResource } from "@/lib/hooks";
import { ActionLink } from "../Button";
import { CardUnreachable } from "../CardStates";
import { PlusIcon, TemplateIcon } from "../icons";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { DataTable, type Column } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";

const COLUMNS: Column<Template>[] = [
  {
    id: "name",
    header: "Nome",
    primary: true,
    cell: (template) => (
      <span className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{template.name}</span>
        {template.is_default && template.name !== "Padrão" && <Badge tone="accent">Padrão</Badge>}
      </span>
    ),
  },
  { id: "subject", header: "Assunto", cell: (template) => <span className="text-muted">{template.subject}</span> },
  { id: "forms", header: "Em uso por", cell: (template) => (template.is_default ? <span className="text-muted">Formulários sem escolha</span> : plural(template.forms_count, "formulário", "formulários")), className: "whitespace-nowrap" },
  { id: "updated", header: "Alterado em", cell: (template) => <span className="text-muted">{formatDate(template.updated_at)}</span>, className: "whitespace-nowrap" },
];

export function TemplatesScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useResource(listTemplates, []);

  const newTemplate = (
    <ActionLink href="/templates/new">
      <PlusIcon /> Novo template
    </ActionLink>
  );

  return (
    <>
      <PageHeader title="Templates">{newTemplate}</PageHeader>

      <Card className="animate-fade-up overflow-hidden">
        {error ? (
          <div className="p-8">
            <CardUnreachable onRetry={reload} />
          </div>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={data ?? []}
            getKey={(template) => template.code}
            onRowClick={(template) => router.push(`/templates/${template.code}`)}
            loading={loading && !data}
            empty={<EmptyState icon={<TemplateIcon />} title="Nenhum template ainda" text="Crie um e escolha em qual formulário usar." action={newTemplate} />}
          />
        )}
      </Card>
    </>
  );
}
