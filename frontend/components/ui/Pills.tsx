"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronIcon } from "../icons";

type Pill<T extends string> = { id: T; label: string };

type PillsProps<T extends string> = {
  label: string;
  value: T;
  options: Pill<T>[];
  onChange: (value: T) => void;
};

const ARROW =
  "absolute inset-y-1 z-20 grid w-9 place-items-center rounded-full bg-bg/80 text-text backdrop-blur-md transition-colors duration-300 hover:bg-bg";

/**
 * Tabs as pills. The highlight is a single element that slides to the chosen pill.
 * When the tabs do not fit, the box stays contained: no scrollbar, drag or swipe to move, and arrows
 * (shown only on the side that has more) scroll it by click.
 */
export function Pills<T extends string>({ label, value, options, onChange }: PillsProps<T>) {
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const [box, setBox] = useState<{ left: number; width: number }>();
  const [edges, setEdges] = useState({ start: false, end: false });

  const updateEdges = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    setEdges({ start: element.scrollLeft > 2, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const active = refs.current.get(value);
      if (active) setBox({ left: active.offsetLeft, width: active.offsetWidth });
      updateEdges();
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [value, options, updateEdges]);

  // The chosen tab is brought to the middle of the box.
  useEffect(() => {
    const element = scroller.current;
    const active = refs.current.get(value);
    if (!element || !active) return;

    element.scrollTo({ left: active.offsetLeft - (element.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
  }, [value]);

  function scrollBy(direction: -1 | 1) {
    const element = scroller.current;
    element?.scrollBy({ left: direction * element.clientWidth * 0.6, behavior: "smooth" });
  }

  function startDrag(event: React.MouseEvent) {
    const element = scroller.current;
    if (!element || event.button !== 0) return;

    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: element.scrollLeft };

    const move = (moveEvent: MouseEvent) => {
      const distance = moveEvent.clientX - drag.current.startX;
      if (Math.abs(distance) > 4) drag.current.moved = true;
      element.scrollLeft = drag.current.startScroll - distance;
    };
    const stop = () => {
      drag.current.active = false;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
  }

  return (
    <div className="relative max-w-full sm:w-fit">
      <div
        ref={scroller}
        onScroll={updateEdges}
        onMouseDown={startDrag}
        // A drag must not end as a click on the tab under the pointer.
        onClickCapture={(event) => {
          if (drag.current.moved) {
            event.stopPropagation();
            event.preventDefault();
            drag.current.moved = false;
          }
        }}
        className="overflow-x-auto overscroll-x-contain rounded-full border border-surface/10 bg-surface/[0.04] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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

      {edges.start && (
        <button type="button" aria-label="Scroll tabs left" onClick={() => scrollBy(-1)} className={`${ARROW} left-1`}>
          <ChevronIcon className="size-5 rotate-180" />
        </button>
      )}
      {edges.end && (
        <button type="button" aria-label="Scroll tabs right" onClick={() => scrollBy(1)} className={`${ARROW} right-1`}>
          <ChevronIcon className="size-5" />
        </button>
      )}
    </div>
  );
}
