"use client";

import { Button, GhostButton } from "../Button";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  /** Red confirm button, for things that cannot be undone. */
  danger?: boolean;
};

export function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onClose, busy = false, danger = false }: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} busy={busy}>
      <p className="text-base leading-relaxed text-muted">{message}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <GhostButton type="button" onClick={onClose} disabled={busy} data-autofocus>
          Cancel
        </GhostButton>
        <Button
          type="button"
          onClick={onConfirm}
          loading={busy}
          className={danger ? "!bg-none bg-danger hover:brightness-110" : ""}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
