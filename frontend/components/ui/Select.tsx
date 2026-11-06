"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronIcon, SearchIcon } from "../icons";

type Option<T extends string> = { value: T; label: string; icon?: ReactNode };

type SelectProps<T extends string> = {
  id: string;
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** A tighter version for dense rows: 44px tall and a quieter label. */
  compact?: boolean;
};

/** A custom select (never the browser's) with search, keyboard support and a popover that is never clipped. */
export function Select<T extends string>({ id, label, value, options, onChange, disabled, compact = false }: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; above: boolean }>();
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;
  }, [options, query]);

  /** Puts the list right under (or above) the button, wherever the page is scrolled to. */
  function place() {
    const box = trigger.current?.getBoundingClientRect();
    if (!box) return;

    const above = window.innerHeight - box.bottom < 320 && box.top > 320;
    setRect({ left: box.left, top: above ? box.top : box.bottom, width: box.width, above });
  }

  function openList() {
    place();
    setQuery("");
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
    setOpen(true);
  }

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function choose(option: Option<T>) {
    onChange(option.value);
    close();
  }

  useEffect(() => {
    if (!open) return;
    search.current?.focus({ preventScroll: true });

    const away = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !document.getElementById(listId)?.contains(target)) setOpen(false);
    };
    // The list follows the button when the page moves (scrolling the list itself is left alone).
    const follow = (event: Event) => {
      if (document.getElementById(listId)?.contains(event.target as Node)) return;
      place();
    };

    document.addEventListener("mousedown", away);
    // A card that is still finishing its entrance animation moves a little: place the list again when it ends.
    document.addEventListener("animationend", follow, true);
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("animationend", follow, true);
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listId]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => Math.min(current + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[active];
      if (option) choose(option);
    }
  }

  return (
    <div>
      <span id={`${id}-label`} className={`block text-base ${compact ? "mb-1 text-muted" : "mb-2 font-medium text-text/90"}`}>
        {label}
      </span>

      <button
        ref={trigger}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        onClick={() => (open ? setOpen(false) : openList())}
        className={`flex ${compact ? "h-11" : "h-14"} w-full items-center justify-between gap-3 rounded-control border bg-surface/[0.04] px-4 text-left text-base transition duration-300 ease-out hover:border-surface/20 disabled:opacity-50 ${
          open ? "border-accent ring-4 ring-accent/20" : "border-surface/10"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected?.icon && <span className="shrink-0 text-text/80">{selected.icon}</span>}
          <span className="truncate">{selected?.label ?? "Select"}</span>
        </span>
        <ChevronIcon className={`size-5 shrink-0 text-muted transition-transform duration-300 ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>

      {open && rect && createPortal(
        <div
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          onKeyDown={onKeyDown}
          style={{ left: rect.left, width: rect.width, ...(rect.above ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.top + 8 }) }}
          className="fixed z-[80] animate-pop overflow-hidden rounded-control border border-surface/15 bg-[#12121f] shadow-[0_30px_80px_-20px_rgb(0_0_0/1)]"
        >
          {options.length > 6 && (
            <div className="flex items-center gap-2 border-b border-surface/10 px-3">
              <SearchIcon className="size-5 text-muted" />
              <input
                ref={search}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                placeholder="Search"
                aria-label="Search"
                className="h-12 w-full bg-transparent text-base text-text placeholder:text-muted/60 focus:outline-none focus-visible:ring-0"
              />
            </div>
          )}

          <ul className="max-h-64 overflow-y-auto p-1.5">
            {filtered.length === 0 && <li className="px-3 py-3 text-base text-muted">Nada encontrado</li>}
            {filtered.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[0.6rem] px-3 text-base transition-colors duration-150 ${
                  index === active ? "bg-accent/15" : ""
                } ${option.value === value ? "text-accent" : "text-text"}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {option.icon && <span className={`shrink-0 ${option.value === value ? "text-accent" : "text-text/80"}`}>{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </span>
                {option.value === value && <CheckIcon className="size-5 shrink-0" />}
              </li>
            ))}
          </ul>

          {/* Keeps the keyboard working when there is no search box. */}
          {options.length <= 6 && <input ref={search} readOnly aria-label="Options" className="sr-only" onKeyDown={onKeyDown} />}
        </div>,
        document.body,
      )}
    </div>
  );
}
