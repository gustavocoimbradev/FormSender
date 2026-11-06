"use client";

import { useRef } from "react";
import { formatBytes } from "@/lib/format";
import { ActionButton } from "./Button";
import { CloseIcon, PaperclipIcon } from "./icons";

type FileFieldProps = {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
};

/** Picks one file. The browser's own file chooser opens from a regular button, so it looks like the rest of the panel. */
export function FileField({ id, label, file, onChange, error, disabled }: FileFieldProps) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4">
      <span id={`${id}-label`} className="mb-2 block text-base font-medium text-text/90">
        {label}
      </span>

      <div className={`flex min-h-14 items-center gap-3 rounded-control border bg-surface/[0.04] px-1.5 transition duration-300 ease-out ${error ? "border-danger/70" : "border-surface/10 hover:border-surface/20"}`}>
        <input
          ref={input}
          id={id}
          type="file"
          className="sr-only"
          aria-labelledby={`${id}-label`}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />

        <ActionButton type="button" variant="ghost" disabled={disabled} onClick={() => input.current?.click()}>
          <PaperclipIcon className="size-5" /> {file ? "Change" : "Choose file"}
        </ActionButton>

        <span className="min-w-0 flex-1 truncate text-base text-muted">{file ? `${file.name} · ${formatBytes(file.size)}` : "No file chosen"}</span>

        {file && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (input.current) input.current.value = "";
              onChange(null);
            }}
            aria-label="Remove file"
            className="grid size-11 shrink-0 place-items-center rounded-control text-muted transition-colors duration-300 hover:bg-surface/[0.08] hover:text-text"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      <div aria-live="polite" className="text-base leading-6">
        {error && <p className="mt-2 animate-fade-in text-danger">{error}</p>}
      </div>
    </div>
  );
}
