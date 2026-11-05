"use client";

/** An on/off switch whose knob slides. */
export function Switch({ id, label, checked, onChange, disabled }: { id: string; label: string; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full border transition-colors duration-300 ease-out disabled:opacity-50 ${checked ? "border-accent bg-accent" : "border-surface/15 bg-surface/10"}`}
      >
        <span className={`absolute left-1 top-1 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${checked ? "translate-x-6" : "translate-x-0"}`} />
      </button>
      <span id={`${id}-label`} className="text-base">
        {label}
      </span>
    </div>
  );
}
