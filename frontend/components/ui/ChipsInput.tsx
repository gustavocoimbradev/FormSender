"use client";

import { useState, type KeyboardEvent } from "react";
import { CloseIcon } from "../icons";

type ChipsInputProps = {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Returns an error message, or null when the value is acceptable. */
  validate?: (value: string) => string | null;
  /** Cleans what was typed before it becomes a chip (lowercase, no spaces...). */
  normalize?: (value: string) => string;
  placeholder?: string;
  hint?: string;
  error?: string;
  max?: number;
  disabled?: boolean;
};

/** A list of short values (emails, domains) typed one by one. Enter, comma or leaving the field adds one. */
export function ChipsInput({ id, label, values, onChange, validate, normalize, placeholder, hint, error, max = 50, disabled }: ChipsInputProps) {
  const [draft, setDraft] = useState("");
  const [problem, setProblem] = useState<string>();

  function commit(raw: string): boolean {
    const value = (normalize ? normalize(raw) : raw.trim()).trim();
    if (!value) {
      setProblem(undefined);
      return true;
    }

    const invalid = validate?.(value);
    if (invalid) {
      setProblem(invalid);
      return false;
    }
    if (values.includes(value)) {
      setDraft("");
      setProblem(undefined);
      return true;
    }
    if (values.length >= max) {
      setProblem(`No máximo ${max} itens.`);
      return false;
    }

    onChange([...values, value]);
    setDraft("");
    setProblem(undefined);
    return true;
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  const message = problem ?? error;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-base font-medium text-text/90">
        {label}
      </label>

      <div
        className={`flex min-h-14 flex-wrap items-center gap-2 rounded-control border bg-surface/[0.04] px-3 py-2 transition duration-300 ease-out focus-within:bg-surface/[0.07] focus-within:ring-4 ${
          message ? "border-danger/70 focus-within:border-danger focus-within:ring-danger/20" : "border-surface/10 hover:border-surface/20 focus-within:border-accent focus-within:ring-accent/20"
        }`}
      >
        {values.map((value) => (
          <span key={value} className="inline-flex min-h-9 max-w-full animate-pop items-center gap-1 rounded-full bg-accent/15 pl-3 pr-1 text-base text-text">
            <span className="truncate">{value}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(values.filter((current) => current !== value))}
              aria-label={`Remover ${value}`}
              className="grid size-8 place-items-center rounded-full text-muted transition-colors duration-300 hover:text-text"
            >
              <CloseIcon className="size-4" />
            </button>
          </span>
        ))}

        <input
          id={id}
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setDraft(event.target.value);
            setProblem(undefined);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          placeholder={values.length === 0 ? placeholder : undefined}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-message` : hint ? `${id}-hint` : undefined}
          className="h-10 min-w-[10rem] flex-1 bg-transparent text-base text-text placeholder:text-muted/60 focus:outline-none focus-visible:ring-0"
        />
      </div>

      <div aria-live="polite" className="text-base leading-6">
        {message ? (
          <p id={`${id}-message`} className="mt-2 text-danger">
            {message}
          </p>
        ) : hint ? (
          <p id={`${id}-hint`} className="mt-2 text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
