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
    header: "Name",
    primary: true,
    cell: (template) => (
      <span className="flex flex-wrap items-center gap-3">
        <span className="font-medium">{template.name}</span>
        {template.is_default && template.name !== "Default" && <Badge tone="accent">Default</Badge>}
      </span>
    ),
  },
  { id: "subject", header: "Subject", cell: (template) => <span className="text-muted">{template.subject}</span> },
  { id: "forms", header: "Used by", cell: (template) => (template.is_default ? <span className="text-muted">Forms with no choice</span> : plural(template.forms_count, "form", "forms")), className: "whitespace-nowrap" },
  { id: "updated", header: "Updated", cell: (template) => <span className="text-muted">{formatDate(template.updated_at)}</span>, className: "whitespace-nowrap" },
];

export function TemplatesScreen() {
  const router = useRouter();
  const { data, loading, error, reload } = useResource(listTemplates, []);

  const newTemplate = (
    <ActionLink href="/templates/new">
      <PlusIcon /> New template
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
            empty={<EmptyState icon={<TemplateIcon />} title="No templates yet" text="Create one and choose which form uses it." action={newTemplate} />}
          />
        )}
      </Card>
    </>
  );
}
