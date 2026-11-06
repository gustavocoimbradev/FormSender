"use client";

import { useState } from "react";
import { ApiError, deleteUser, listUsers, type ManagedUser } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useResource } from "@/lib/hooks";
import { canDeleteUser, canEditUser, roleLabel } from "@/lib/permissions";
import { ActionButton } from "../Button";
import { CardUnreachable } from "../CardStates";
import { ChevronIcon, PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "../icons";
import { useSession } from "../panel/PanelFrame";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { DataTable, type Column } from "../ui/DataTable";
import { EmptyState } from "../ui/EmptyState";
import { Pagination } from "../ui/Pagination";
import { useToast } from "../ui/Toast";
import { UserModal } from "./UserModal";

const ICON_BUTTON = "grid size-11 place-items-center rounded-control text-muted transition-colors duration-300 hover:bg-surface/[0.08] hover:text-text";

/** The accounts: a list with its creation, edition and removal. It lives in the Users tab of the settings. */
export function UsersPanel() {
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
      toast("User deleted.");
      setRemoving(undefined);
      reload();
    } catch (failure) {
      toast(failure instanceof ApiError && failure.status === 403 ? "You cannot delete this user." : "Could not delete.", "error");
    } finally {
      setBusy(false);
    }
  }

  const columns: Column<ManagedUser>[] = [
    {
      id: "name",
      header: "Name",
      primary: true,
      cell: (item) => (
        <span className="inline-flex flex-wrap items-center gap-2 font-medium">
          {item.name}
          {item.id === actor.id && <Badge tone="neutral">You</Badge>}
          {!item.email_confirmed && <Badge tone="warning">Waiting for confirmation</Badge>}
        </span>
      ),
    },
    { id: "email", header: "Email", cell: (item) => <span className="break-all text-muted">{item.email}</span> },
    { id: "role", header: "Role", cell: (item) => <Badge tone={item.role === "admin" ? "accent" : "neutral"}>{roleLabel(item)}</Badge>, className: "whitespace-nowrap" },
    { id: "created", header: "Created", cell: (item) => <span className="text-muted">{formatDate(item.created_at)}</span>, className: "whitespace-nowrap" },
    {
      id: "actions",
      header: "Actions",
      className: "w-px whitespace-nowrap",
      cell: (item) => (
        <span className="inline-flex gap-1">
          {canEditUser(actor) && (
            <button type="button" className={ICON_BUTTON} onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>
              <PencilIcon />
            </button>
          )}
          {canDeleteUser(actor, item) && (
            <button type="button" className={`${ICON_BUTTON} hover:!text-danger`} onClick={() => setRemoving(item)} aria-label={`Delete ${item.name}`}>
              <TrashIcon />
            </button>
          )}
        </span>
      ),
    },
  ];

  const newUser = (
    <ActionButton type="button" onClick={() => setEditing("new")} className="max-sm:w-full">
      <PlusIcon /> New user
    </ActionButton>
  );

  return (
    <>
      <div className="mb-4 flex sm:justify-end">{newUser}</div>

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
              onRowClick={(item) => canEditUser(actor) && setEditing(item)}
              renderMobileRow={(item) => (
                <div className="flex min-h-14 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface/10 text-lg font-semibold">{(item.name.trim()[0] ?? "?").toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-medium">
                      {item.name}
                      {item.id === actor.id && <span className="ml-2 text-base font-normal text-muted">(you)</span>}
                    </p>
                    <p className="truncate text-base text-muted">{item.email}</p>
                  </div>
                  {!item.email_confirmed && <Badge tone="warning">Waiting</Badge>}
                  {item.role === "admin" && <Badge tone="accent">Admin</Badge>}
                  {canEditUser(actor) && <ChevronIcon className="size-5 shrink-0 text-muted" />}
                </div>
              )}
              loading={loading && !data}
              skeletonAvatar
              empty={<EmptyState icon={<UsersIcon />} title="No users" action={newUser} />}
            />
            {data && <Pagination meta={data.meta} onPage={setPage} />}
          </>
        )}
      </Card>

      <UserModal
        open={editing !== undefined}
        actor={actor}
        user={editing === "new" ? undefined : editing}
        onClose={() => setEditing(undefined)}
        onSaved={reload}
        onDelete={(item) => {
          setEditing(undefined);
          setRemoving(item);
        }}
      />

      <ConfirmDialog
        open={removing !== undefined}
        title="Delete user?"
        message={removing ? `${removing.name} (${removing.email}) loses access immediately.` : ""}
        confirmLabel="Delete user"
        onConfirm={() => void remove()}
        onClose={() => setRemoving(undefined)}
        busy={busy}
        danger
      />
    </>
  );
}
