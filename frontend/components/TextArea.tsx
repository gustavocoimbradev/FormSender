import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string; error?: string };

/** A multi-line field, in the same look as the single-line one. */
export function TextArea({ id, label, error, className = "", ...props }: TextAreaProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-base font-medium text-text/90">
        {label}
      </label>

      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full resize-none rounded-control border bg-surface/[0.04] px-4 py-3 text-base text-text transition duration-300 ease-out placeholder:text-muted/60 hover:border-surface/20 focus:bg-surface/[0.07] focus:outline-none focus:ring-4 focus-visible:ring-4 ${
          error ? "border-danger/70 focus:border-danger focus:ring-danger/20" : "border-surface/10 focus:border-accent focus:ring-accent/20"
        } ${className}`}
        {...props}
      />

      <div aria-live="polite" className="text-base leading-6">
        {error && (
          <p id={`${id}-error`} className="mt-2 animate-fade-in text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
