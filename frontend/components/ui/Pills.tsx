"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronIcon } from "../icons";

type Pill<T extends string> = { id: T; label: string };

type PillsProps<T extends string> = {
  label: string;
  value: T;
  options: Pill<T>[];
  onChange: (value: T) => void;
};

/** Bare arrows: no background, they sit over the faded edge of the tabs. */
const ARROW = "absolute inset-y-0 z-20 grid w-8 place-items-center text-muted transition-[color,opacity] duration-300 hover:text-text";

/** Width left clear for an arrow, and the width over which the tabs then fade in. */
const ARROW_ZONE = 30;
const FADE_WIDTH = 34;

/**
 * Tabs as pills. The highlight is a single element that slides to the chosen pill.
 * When the tabs do not fit, the box stays contained: no scrollbar and no swiping. The arrows (shown only on a
 * side that has another tab) choose the previous or next tab, and the chosen tab is always brought into view.
 */
export function Pills<T extends string>({ label, value, options, onChange }: PillsProps<T>) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ left: number; width: number }>();
  const [overflowing, setOverflowing] = useState(false);

  const index = options.findIndex((option) => option.id === value);
  const hasPrevious = overflowing && index > 0;
  const hasNext = overflowing && index < options.length - 1;

  useLayoutEffect(() => {
    const measure = () => {
      const element = scroller.current;
      const active = refs.current.get(value);
      if (active) setBox({ left: active.offsetLeft, width: active.offsetWidth });
      if (element) setOverflowing(element.scrollWidth > element.clientWidth + 2);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options]);

  // The chosen tab is brought to the middle of the box (the box itself is never scrolled by hand).
  useLayoutEffect(() => {
    const element = scroller.current;
    const active = refs.current.get(value);
    if (!element || !active) return;

    element.scrollTo({ left: active.offsetLeft - (element.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
  }, [value, overflowing]);

  function go(direction: -1 | 1) {
    const target = options[index + direction];
    if (target) onChange(target.id);
  }

  // Under an arrow the tabs are invisible, then they fade in: the arrow never competes with a tab.
  const start = hasPrevious ? ARROW_ZONE : 0;
  const end = hasNext ? ARROW_ZONE : 0;
  const mask = `linear-gradient(to right, transparent 0, transparent ${start}px, black ${start ? start + FADE_WIDTH : 0}px, black calc(100% - ${end ? end + FADE_WIDTH : 0}px), transparent calc(100% - ${end}px), transparent 100%)`;

  return (
    <div className="relative max-w-full overflow-hidden rounded-full border border-surface/10 bg-surface/[0.04] sm:w-fit">
      <div ref={scroller} style={{ maskImage: mask, WebkitMaskImage: mask }} className="touch-pan-y overflow-x-hidden">
        <div role="tablist" aria-label={label} className="relative inline-flex min-w-full gap-1 p-1 sm:min-w-0">
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
              className={`relative z-10 h-11 shrink-0 select-none whitespace-nowrap rounded-full px-5 text-base font-medium transition-colors duration-300 ${
                option.id === value ? "text-white" : "text-muted hover:text-text"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous tab"
        aria-hidden={!hasPrevious}
        tabIndex={hasPrevious ? 0 : -1}
        onClick={() => go(-1)}
        className={`${ARROW} left-0.5 ${hasPrevious ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronIcon className="size-5 rotate-180" />
      </button>
      <button
        type="button"
        aria-label="Next tab"
        aria-hidden={!hasNext}
        tabIndex={hasNext ? 0 : -1}
        onClick={() => go(1)}
        className={`${ARROW} right-0.5 ${hasNext ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <ChevronIcon className="size-5" />
      </button>
    </div>
  );
}
