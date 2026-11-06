"use client";

import { useState } from "react";
import { setRetentionDays } from "@/lib/api";
import { ActionButton } from "../Button";
import { Card, CardHeader } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Select } from "../ui/Select";
import { useToast } from "../ui/Toast";

const PERIODS: { days: number; label: string }[] = [
  { days: 0, label: "Forever" },
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 180, label: "6 months" },
  { days: 365, label: "1 year" },
];

/** The periods to choose from, plus the current one when it is not among them (a value set by the server's environment). */
function optionsFor(current: number) {
  const known = PERIODS.some((period) => period.days === current);
  const list = known ? PERIODS : [...PERIODS, { days: current, label: `${current} days` }].sort((a, b) => (a.days || Infinity) - (b.days || Infinity));
  return list.map((period) => ({ value: String(period.days), label: period.label }));
}

/** How long the messages (and their files) stay in the panel. */
export function StorageTab({ retentionDays }: { retentionDays: number }) {
  const toast = useToast();
  const [saved, setSaved] = useState(retentionDays);
  const [choice, setChoice] = useState(String(retentionDays));
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const days = Number(choice);
  const options = optionsFor(saved);
  // Keeping less than before deletes messages that exist now, so it asks first.
  const deletesSomething = days > 0 && (saved === 0 || days < saved);

  async function save() {
    setSaving(true);

    try {
      setSaved(await setRetentionDays(days));
      setConfirming(false);
      toast(days === 0 ? "Messages are kept forever." : `Messages are kept for ${options.find((option) => option.value === choice)?.label}.`);
    } catch {
      toast("Could not save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="animate-fade-up">
      <CardHeader title="Messages" />

      <div className="px-5 pb-6 sm:px-6">
        <div className="mb-3 sm:max-w-xs">
          <Select id="retention" label="Keep messages for" value={choice} options={options} onChange={setChoice} disabled={saving} />
        </div>
        <p className="mb-5 text-base text-muted">Older messages are deleted every day, together with their attachments. Forever keeps everything.</p>

        <div className="flex justify-end">
          <ActionButton type="button" loading={saving} disabled={days === saved} onClick={() => (deletesSomething ? setConfirming(true) : void save())} className="h-14 w-full px-8 sm:w-auto">
            Save
          </ActionButton>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete older messages?"
        message={`Messages older than ${options.find((option) => option.value === choice)?.label ?? `${days} days`} will be deleted during the next daily cleanup, with their attachments. This cannot be undone.`}
        confirmLabel="Save and delete"
        onConfirm={() => void save()}
        onClose={() => setConfirming(false)}
        busy={saving}
        danger
      />
    </Card>
  );
}
