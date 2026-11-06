"use client";

import { useState } from "react";
import { ApiError, resendDestinationConfirmation, type Form } from "@/lib/api";
import { ActionButton } from "../Button";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";

/** The destinations of a saved form that have not confirmed yet: they receive nothing until they open the link sent to them. */
export function PendingDestinations({ form }: { form: Form }) {
  const toast = useToast();
  const [sending, setSending] = useState<string>();

  const confirmed = new Set(form.confirmed_destinations.map((address) => address.toLowerCase()));
  const waiting = form.destinations.filter((address) => !confirmed.has(address.toLowerCase()));

  if (waiting.length === 0) return null;

  async function sendAgain(address: string) {
    setSending(address);

    try {
      await resendDestinationConfirmation(form.code, address);
      toast("A new link is on its way.");
    } catch (failure) {
      toast(failure instanceof ApiError && failure.status === 429 ? "A link was sent a moment ago. Wait a minute." : "Could not send it. Please try again.", "error");
    } finally {
      setSending(undefined);
    }
  }

  return (
    <div className="mb-5" aria-live="polite">
      <p className="mb-2 text-base text-muted">Waiting for confirmation. These addresses get the messages once they open the link we emailed them.</p>
      <ul className="divide-y divide-surface/10 rounded-control border border-surface/10">
        {waiting.map((address) => (
          <li key={address} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="break-all text-base">{address}</span>
              <Badge tone="warning">Waiting</Badge>
            </span>
            <ActionButton type="button" variant="ghost" loading={sending === address} onClick={() => void sendAgain(address)}>
              Send again
            </ActionButton>
          </li>
        ))}
      </ul>
    </div>
  );
}
