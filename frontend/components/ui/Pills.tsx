"use client";

import { useLayoutEffect, useRef, useState } from "react";

type Pill<T extends string> = { id: T; label: string };

type PillsProps<T extends string> = {
  label: string;
  value: T;
  options: Pill<T>[];
  onChange: (value: T) => void;
};

/** Tabs as pills. The highlight is a single element that slides to the chosen pill. */
export function Pills<T extends string>({ label, value, options, onChange }: PillsProps<T>) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const [box, setBox] = useState<{ left: number; width: number }>();

  useLayoutEffect(() => {
    const measure = () => {
      const active = refs.current.get(value);
      if (active) setBox({ left: active.offsetLeft, width: active.offsetWidth });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options]);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div role="tablist" aria-label={label} className="relative inline-flex min-w-full gap-1 rounded-full border border-surface/10 bg-surface/[0.04] p-1 sm:min-w-0">
        {box && (
          <span
            aria-hidden="true"
            data-testid="pills-indicator"
            className="absolute bottom-1 top-1 rounded-full bg-accent shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.7)] transition-[transform,width] duration-[420ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: box.width, transform: `translateX(${box.left - 4}px)`, left: 4 }}
          />
        )}

        {options.map((option) => (
          <button
            key={option.id}
            ref={(element) => {
              if (element) refs.current.set(option.id, element);
            }}
            type="button"
            role="tab"
            aria-selected={option.id === value}
            onClick={() => onChange(option.id)}
            className={`relative z-10 h-11 shrink-0 whitespace-nowrap rounded-full px-5 text-base font-medium transition-colors duration-300 ${
              option.id === value ? "text-white" : "text-muted hover:text-text"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
