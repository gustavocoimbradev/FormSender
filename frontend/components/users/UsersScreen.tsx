"use client";

import { useState } from "react";
import { ApiError, deleteUser, listUsers, type ManagedUser } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useResource } from "@/lib/hooks";
import { canDeleteUser, canEditUser, roleLabel } from "@/lib/permissions";
import { ActionButton } from "../Button";
import { CardUnreachable } from "../CardStates";
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "../icons";
import { useSession } from "../panel/PanelFrame";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DataTable, type Column } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { PageHeader } from "../ui/PageHeader";
import { Pagination } from "../ui/Pagination";
import { useToast } from "../ui/Toast";
import { UserModal } from "./UserModal";

const ICON_BUTTON = "grid size-11 place-items-center rounded-control text-muted transition-colors duration-300 hover:bg-surface/[0.08] hover:text-text";

export function UsersScreen() {
  const { user: actor } = useSession();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useResource(() => listUsers(page), [page]);
  const [editing, setEditing] = useState<ManagedUser | "new">();
  const [removing, setRemoving] = useState<ManagedUser>();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!removing) return;
    setBusy(true);
    try {
      await deleteUser(removing.id);
      toast("Usuário excluído.");
      setRemoving(undefined);
      reload();
    } catch (failure) {
      toast(failure instanceof ApiError && failure.status === 403 ? "Você não pode excluir esse usuário." : "Não foi possível excluir.", "error");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<ManagedUser>[] = [
    {
      id: "name",
      header: "Nome",
      primary: true,
      cell: (item) => (
        <span className="inline-flex flex-wrap items-center gap-2 font-medium">
          {item.name}
          {item.id === actor.id && <Badge tone="neutral">Você</Badge>}
        </span>
      ),
    },
    { id: "email", header: "E-mail", cell: (item) => <span className="break-all text-muted">{item.email}</span> },
    { id: "role", header: "Papel", cell: (item) => <Badge tone={item.role === "admin" ? "accent" : "neutral"}>{roleLabel(item)}</Badge>, className: "whitespace-nowrap" },
    { id: "created", header: "Criado em", cell: (item) => <span className="text-muted">{formatDate(item.created_at)}</span>, className: "whitespace-nowrap" },
    {
      id: "actions",
      header: "Ações",
      className: "w-px whitespace-nowrap",
      cell: (item) => (
        <span className="inline-flex gap-1">
          {canEditUser(actor, item) && (
            <button type="button" className={ICON_BUTTON} onClick={() => setEditing(item)} aria-label={`Editar ${item.name}`}>
              <PencilIcon />
            </button>
          )}
          {canDeleteUser(actor, item) && (
            <button type="button" className={`${ICON_BUTTON} hover:!text-danger`} onClick={() => setRemoving(item)} aria-label={`Excluir ${item.name}`}>
              <TrashIcon />
            </button>
          )}
        </span>
      ),
    },
  ];

  const newUser = (
    <ActionButton type="button" onClick={() => setEditing("new")}>
      <PlusIcon /> Novo usuário
    </ActionButton>
  );

  return (
    <>
      <PageHeader title="Usuários">{newUser}</PageHeader>

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
              loading={loading && !data}
              empty={<EmptyState icon={<UsersIcon />} title="Nenhum usuário" action={newUser} />}
            />
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </>
        )}
      </Card>

      <UserModal open={editing !== undefined} actor={actor} user={editing === "new" ? undefined : editing} onClose={() => setEditing(undefined)} onSaved={reload} />

      <ConfirmDialog
        open={removing !== undefined}
        title="Excluir usuário?"
        message={removing ? `${removing.name} (${removing.email}) perde o acesso na hora.` : ""}
        confirmLabel="Excluir usuário"
        onConfirm={() => void remove()}
        onClose={() => setRemoving(undefined)}
        busy={busy}
        danger
      />
    </>
  );
}
