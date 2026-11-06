import { useEffect, useRef, type InputHTMLAttributes, type ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  /** Rendered between the input and the message (e.g. a strength meter). */
  footer?: ReactNode;
  /** Shown on the right of the label (e.g. the password strength). */
  labelAside?: ReactNode;
  /** A tighter version for dense rows: 44px tall, no bottom margin. */
  compact?: boolean;
  /** Keeps the label for screen readers only (the placeholder tells sighted people what to type). */
  hideLabel?: boolean;
};

/** Labelled input with an animated focus glow and an inline error that announces itself. */
export function Field({ id, label, hint, error, icon, trailing, footer, labelAside, compact = false, hideLabel = false, className = "", ...input }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const box = useRef<HTMLDivElement>(null);

  // A small shake when an error shows up. It runs on the existing element, so the
  // input is never remounted (which would take the focus away while typing).
  useEffect(() => {
    if (!error || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    box.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }, [error]);

  return (
    <div className={compact ? "" : "mb-4"}>
      <div className={hideLabel ? "sr-only" : `flex items-baseline justify-between gap-3 ${compact ? "mb-1" : "mb-2"}`}>
        <label htmlFor={id} className={`text-base ${compact ? "text-muted" : "font-medium text-text/90"}`}>
          {label}
        </label>
        {labelAside}
      </div>

      <div
        ref={box}
        className={`group relative flex items-center rounded-control border bg-surface/[0.04] transition duration-300 ease-out focus-within:bg-surface/[0.07] focus-within:ring-4 ${
          error
            ? "border-danger/70 focus-within:border-danger focus-within:ring-danger/20"
            : "border-surface/10 hover:border-surface/20 focus-within:border-accent focus-within:ring-accent/20"
        }`}
      >
        {icon && (
          <span className="pointer-events-none pl-4 text-muted transition-colors duration-300 group-focus-within:text-accent">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${compact ? "h-11" : "h-14"} w-full min-w-0 bg-transparent text-base text-text placeholder:text-muted/60 focus:outline-none focus-visible:ring-0 ${icon ? "pl-3 pr-4" : "px-4"} ${className}`}
          {...input}
        />
        {trailing && <span className="pr-1.5">{trailing}</span>}
      </div>

      {footer && <div className="mt-3">{footer}</div>}

      <div aria-live="polite" className="text-base leading-6">
        {error ? (
          <p id={`${id}-error`} className={`animate-fade-in text-danger ${compact ? "mt-1" : "mt-2"}`}>
            {error}
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
