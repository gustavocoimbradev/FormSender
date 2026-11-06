"use client";

import { useEffect, useState } from "react";
import { getQuotas, type QuotaUsage } from "@/lib/api";

type Item = { id: string; label: string; used: number; limit: number };

/** Green-violet while there is room, amber when it is nearly full, red when it is full. */
function tone(used: number, limit: number): { bar: string; text: string; state: "ok" | "near" | "full" } {
  if (used >= limit) return { bar: "bg-danger", text: "text-danger", state: "full" };
  if (used / limit >= 0.8) return { bar: "bg-[#ffb454]", text: "text-[#ffb454]", state: "near" };
  return { bar: "bg-gradient-to-r from-accent to-accent-2", text: "text-muted", state: "ok" };
}

function itemsOf(usage: QuotaUsage): Item[] {
  const all = [
    { id: "forms", label: "Forms", ...usage.forms },
    { id: "daily", label: "Messages today", ...usage.daily_submissions },
  ];

  return all.flatMap((item) => (item.limit === null ? [] : [{ id: item.id, label: item.label, used: item.used, limit: item.limit }]));
}

/** What the account has used against the limits the administrator set. Nothing shows when there are no limits. */
export function QuotaBars() {
  const [usage, setUsage] = useState<QuotaUsage>();

  useEffect(() => {
    let active = true;

    getQuotas()
      .then((value) => active && setUsage(value))
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const items = usage ? itemsOf(usage) : [];
  if (items.length === 0) return null;

  return (
    <div className="mt-3 space-y-4 border-t border-surface/10 pt-3" aria-label="Your limits">
      {items.map((item) => {
        const { bar, text, state } = tone(item.used, item.limit);
        const percent = Math.min(100, Math.round((item.used / item.limit) * 100));

        return (
          <div key={item.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-base">
              <span>{item.label}</span>
              <span className={`tabular-nums ${text}`}>
                {item.used} / {item.limit}
              </span>
            </div>
            <div role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={item.limit} aria-valuenow={Math.min(item.used, item.limit)} className="h-2.5 overflow-hidden rounded-full bg-surface/10">
              <div className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${bar}`} style={{ width: `${percent}%` }} />
            </div>
            {state === "full" && <p className="mt-1 text-base text-danger">Limit reached.</p>}
          </div>
        );
      })}
    </div>
  );
}
