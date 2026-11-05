"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "../icons";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Blocks closing (Escape, backdrop, X) while something is being saved. */
  busy?: boolean;
  size?: "md" | "lg";
};

/** A dialog on desktop, a bottom sheet on phones. Escape and the backdrop close it. */
export function Modal({ open, title, onClose, children, busy = false, size = "md" }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("input, select, textarea, [data-autofocus]")?.focus();
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => !busy && onClose()} />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-card border border-surface/10 bg-[#0e0e1a] shadow-[0_40px_100px_-30px_rgb(0_0_0/1)] sm:animate-pop sm:rounded-card ${
          size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg"
        }`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-surface/10 px-6 py-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="grid size-11 place-items-center rounded-control text-muted transition-colors duration-300 hover:text-text disabled:opacity-40"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
