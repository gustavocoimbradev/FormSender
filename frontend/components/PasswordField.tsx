"use client";

import { useState } from "react";
import { Field } from "./Field";
import { passwordStrength } from "@/lib/validation";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  /** Live strength meter; for choosing a password, not for typing an existing one. */
  showStrength?: boolean;
  placeholder?: string;
};

const BAR_COLORS = ["bg-surface/10", "bg-danger", "bg-[#ffb454]", "bg-accent-2", "bg-success"];

const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="m3 3 18 18" />}
  </svg>
);

const Lock = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** Password input with a show/hide toggle and a live strength meter. */
export function PasswordField({ id, label, value, onChange, onBlur, error, disabled, showStrength = true, placeholder = "Mínimo de 8 caracteres" }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const { score, label: strengthLabel } = passwordStrength(value);

  return (
    <Field
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      error={error}
      disabled={disabled}
      icon={<Lock />}
      autoComplete="new-password"
      placeholder={placeholder}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          className="grid size-11 place-items-center rounded-control text-muted transition-colors duration-300 hover:text-text"
        >
          <Eye off={visible} />
        </button>
      }
      labelAside={
        showStrength && value.length > 0 ? (
          <span className="animate-fade-in text-base text-muted" aria-live="polite">
            {strengthLabel}
          </span>
        ) : undefined
      }
      footer={
        showStrength ? (
          <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1.5 rounded-full transition-colors duration-500 ease-out ${step <= score ? BAR_COLORS[score] : "bg-surface/10"}`}
              />
            ))}
          </div>
        ) : undefined
      }
    />
  );
}
