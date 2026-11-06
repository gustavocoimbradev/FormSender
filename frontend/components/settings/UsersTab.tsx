"use client";

import { useState } from "react";
import { setAllowRegistration } from "@/lib/api";
import { UsersPanel } from "../users/UsersPanel";
import { Card, CardHeader } from "../ui/Card";
import { Switch } from "../ui/Switch";
import { useToast } from "../ui/Toast";

/** Whether anyone can create an account, and the accounts themselves. */
export function UsersTab({ allowRegistration }: { allowRegistration: boolean }) {
  const toast = useToast();
  const [allowed, setAllowed] = useState(allowRegistration);
  const [saving, setSaving] = useState(false);

  async function change(next: boolean) {
    setAllowed(next);
    setSaving(true);

    try {
      await setAllowRegistration(next);
      toast(next ? "Anyone can create an account now." : "New accounts are closed.");
    } catch {
      setAllowed(!next);
      toast("Could not save. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="animate-fade-up">
        <CardHeader title="New accounts" />
        <div className="px-5 pb-6 sm:px-6">
          <Switch id="allow-registration" label="Allow new accounts" checked={allowed} onChange={(next) => void change(next)} disabled={saving} />
          <p className="mt-2 text-base text-muted">
            {allowed
              ? "Anyone can create an account and make their own forms here. You see all of them; they see only theirs."
              : "Only you can create accounts, below."}
          </p>
        </div>
      </Card>

      <UsersPanel />
    </div>
  );
}
