"use client";

import { useRouter } from "next/navigation";
import { listTemplates, type Template } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import { useResource } from "@/lib/hooks";
import { ActionLink, PhoneLabel } from "../Button";
import { CardUnreachable } from "../CardStates";
import { ChevronIcon, PlusIcon, TemplateIcon } from "../icons";
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
    <ActionLink href="/templates/new" roundOnPhone>
      <PlusIcon /> <PhoneLabel>New template</PhoneLabel>
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
            renderMobileRow={(template) => (
              <div className="flex min-h-14 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium">{template.name}</p>
                  <p className="truncate text-base text-muted">{template.subject}</p>
                </div>
                {template.is_default && template.name !== "Default" && <Badge tone="accent">Default</Badge>}
                <ChevronIcon className="size-5 shrink-0 text-muted" />
              </div>
            )}
            loading={loading && !data}
            empty={<EmptyState icon={<TemplateIcon />} title="No templates yet" text="Create one and choose which form uses it." action={newTemplate} />}
          />
        )}
      </Card>
    </>
  );
}
