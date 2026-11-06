"use client";

import { useSortable } from "@dnd-kit/sortable";
import { useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { Field } from "../Field";
import { GripIcon, TrashIcon } from "../icons";
import { ChipsInput } from "../ui/ChipsInput";
import { Select } from "../ui/Select";
import { Switch } from "../ui/Switch";
import { FIELD_TYPES, type FieldDraft } from "./formDraft";

type FieldRowProps = {
  field: FieldDraft;
  errors: { name?: string; label?: string; options?: string };
  disabled: boolean;
  /** Only the field that was just added takes the focus, once, when it appears. */
  autoFocus: boolean;
  onChange: (changes: Partial<FieldDraft>) => void;
  onRemove: () => void;
};

const ICON_BUTTON = "grid size-11 place-items-center rounded-control text-muted transition-colors duration-300 hover:bg-surface/[0.08] hover:text-text disabled:opacity-30";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One field of the form, as a compact row that can be dragged by its grip (or moved with the keyboard: Space, arrows, Space). */
export function FieldRow({ field, errors, disabled, autoFocus, onChange, onRemove }: FieldRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: field.key,
    disabled,
    transition: prefersReducedMotion() ? null : { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  });

  // The entrance plays once. Left on, it would play again every time the browser moves the row after a reorder.
  const [entered, setEntered] = useState(false);

  return (
    // The entrance animation lives on the inner element: it keeps a transform, which would fight the drag.
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={isDragging ? "relative z-10" : "relative"}>
      <div
        onAnimationEnd={(event) => event.target === event.currentTarget && setEntered(true)}
        className={`${entered ? "" : "animate-pop"} rounded-control border p-3 transition-colors duration-300 sm:p-4 ${isDragging ? "border-accent/60 bg-surface/[0.1] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]" : "border-surface/10 bg-bg/40"}`}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 xl:grid-cols-[auto_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_auto_auto] xl:items-start">
          <div className="col-span-2 sm:col-span-1 xl:order-2">
            <Field
              compact
              hideLabel
              id={`${field.key}-label`}
              label="Label"
              value={field.label}
              onChange={(event) => onChange({ label: event.target.value })}
              error={errors.label ?? errors.name}
              disabled={disabled}
              placeholder="Label, like Your email"
              autoComplete="off"
              autoFocus={autoFocus}
            />
          </div>

          {/* Informative only: it comes from the label and, once the form is saved, never changes (sites already send it). */}
          <div className="col-span-2 sm:col-span-1 xl:order-3">
            <Field
              compact
              hideLabel
              readOnly
              id={`${field.key}-name`}
              label="Field name"
              title="The technical name sent with each message. It comes from the label and stays the same once the form is saved."
              value={field.name}
              placeholder="field_name"
              className="cursor-default font-mono !text-muted"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="col-span-2 xl:order-4 xl:col-span-1">
            <Select compact hideLabel id={`${field.key}-type`} label="Type" value={field.type} options={FIELD_TYPES} onChange={(type) => onChange({ type })} disabled={disabled} />
          </div>

          {/* Below xl this is its own row (grip and Required on the left, remove on the right); on wide screens its parts become cells of the row, the grip first. */}
          <div className="col-span-2 flex items-center justify-between gap-2 xl:contents">
            <div className="flex items-center gap-1 xl:contents">
              <button
                type="button"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                disabled={disabled}
                aria-label="Drag to reorder"
                className={`${ICON_BUTTON} -ml-2 touch-none text-muted/60 xl:order-1 ${isDragging ? "cursor-grabbing text-accent" : "cursor-grab"}`}
              >
                <GripIcon />
              </button>

              <div className="xl:order-5">
                <Switch id={`${field.key}-required`} label="Required" checked={field.required} onChange={(required) => onChange({ required })} disabled={disabled} />
              </div>
            </div>

            <button type="button" className={`${ICON_BUTTON} hover:!text-danger xl:order-6`} onClick={onRemove} disabled={disabled} aria-label="Remove field">
              <TrashIcon />
            </button>
          </div>

          {field.type === "select" && (
            <div className="col-span-2 xl:order-7 xl:col-span-6">
              <ChipsInput
                id={`${field.key}-options`}
                label="Options"
                values={field.options}
                onChange={(options) => onChange({ options })}
                error={errors.options}
                placeholder="Type an option and press Enter"
                disabled={disabled}
                max={100}
              />
            </div>
          )}

          {field.type === "file" && <p className="col-span-2 text-base text-muted xl:order-7 xl:col-span-6">The visitor picks a file. It travels as an attachment on the email.</p>}
        </div>
      </div>
    </div>
  );
}
