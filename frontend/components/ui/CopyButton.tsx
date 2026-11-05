"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "../icons";

/** Copies a value and confirms it for a moment. `icon` is the quiet version that lives inside a box. */
export function CopyButton({ value, label = "Copiar", variant = "button" }: { value: string; label?: string; variant?: "button" | "icon" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copiado" : label}
        title={copied ? "Copiado" : label}
        className={`grid size-11 shrink-0 place-items-center rounded-control transition-colors duration-300 ${copied ? "text-success" : "text-muted hover:text-text"}`}
      >
        {copied ? <CheckIcon className="size-5 animate-pop" /> : <CopyIcon className="size-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copiado" : label}
      className={`inline-flex h-11 items-center gap-2 rounded-control border px-4 text-base font-medium transition-colors duration-300 ${
        copied ? "border-success/40 bg-success/10 text-success" : "border-surface/15 text-text hover:bg-surface/[0.06]"
      }`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copiado" : label}
    </button>
  );
}
