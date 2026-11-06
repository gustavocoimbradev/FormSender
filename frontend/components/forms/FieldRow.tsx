"use client";

import { useSortable } from "@dnd-kit/sortable";
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

  return (
    // The entrance animation lives on the inner element: it keeps a transform, which would fight the drag.
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={isDragging ? "relative z-10" : "relative"}>
      <div className={`animate-pop rounded-control border p-3 transition-colors duration-300 sm:p-4 ${isDragging ? "border-accent/60 bg-surface/[0.1] shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)]" : "border-surface/10 bg-bg/40"}`}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_auto]">
          <Field
            compact
            id={`${field.key}-label`}
            label="Label"
            value={field.label}
            onChange={(event) => onChange({ label: event.target.value })}
            error={errors.label}
            disabled={disabled}
            placeholder="Your email"
            autoComplete="off"
            autoFocus={autoFocus}
          />
          <Field
            compact
            id={`${field.key}-name`}
            label="Field name"
            value={field.name}
            onChange={(event) => onChange({ name: event.target.value, nameTouched: true })}
            error={errors.name}
            disabled={disabled}
            placeholder="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />

          <div className="col-span-2 sm:col-span-1">
            <Select compact id={`${field.key}-type`} label="Type" value={field.type} options={FIELD_TYPES} onChange={(type) => onChange({ type })} disabled={disabled} />
          </div>

          <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:pt-7">
            <Switch id={`${field.key}-required`} label="Required" checked={field.required} onChange={(required) => onChange({ required })} disabled={disabled} />

            <div className="flex">
              <button type="button" className={`${ICON_BUTTON} hover:!text-danger`} onClick={onRemove} disabled={disabled} aria-label="Remove field">
                <TrashIcon />
              </button>
              <button
                type="button"
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                disabled={disabled}
                aria-label="Drag to reorder"
                className={`${ICON_BUTTON} touch-none text-muted/60 ${isDragging ? "cursor-grabbing text-accent" : "cursor-grab"}`}
              >
                <GripIcon />
              </button>
            </div>
          </div>

          {field.type === "select" && (
            <div className="col-span-2 xl:col-span-4">
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

          {field.type === "file" && <p className="col-span-2 text-base text-muted xl:col-span-4">The visitor picks a file. It travels as an attachment on the email.</p>}
        </div>
      </div>
    </div>
  );
}
