"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/api";
import { useResource } from "@/lib/hooks";
import { CardUnreachable } from "../CardStates";
import { PageHeader, usePhoneLayout } from "../ui/PageHeader";
import { Pills } from "../ui/Pills";
import { Bar, FieldsRow } from "../ui/Skeleton";
import { Card } from "../ui/Card";
import { SmtpTab } from "./SmtpTab";
import { StorageTab } from "./StorageTab";
import { UsersTab } from "./UsersTab";

type Tab = "smtp" | "users" | "storage";

const TABS: { id: Tab; label: string }[] = [
  { id: "smtp", label: "SMTP" },
  { id: "users", label: "Users" },
  { id: "storage", label: "Storage" },
];

const isTab = (value: string): value is Tab => TABS.some((tab) => tab.id === value);

export function SettingsScreen() {
  const phone = usePhoneLayout();
  const { data, loading, error, reload } = useResource(getSettings, []);
  const [tab, setTab] = useState<Tab>("smtp");

  // A link can open one tab straight away (/settings#users).
  useEffect(() => {
    const follow = () => {
      const wanted = window.location.hash.slice(1);
      if (isTab(wanted)) setTab(wanted);
    };

    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);

  function choose(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  return (
    <>
      <PageHeader title="Settings" />

      <div className="mb-6">
        <Pills label="Settings sections" value={tab} options={TABS} onChange={choose} single={phone} />
      </div>

      {error ? (
        <Card className="p-8">
          <CardUnreachable onRetry={reload} />
        </Card>
      ) : loading || !data ? (
        <Card className="px-5 pb-6 pt-6 sm:px-6" >
          <div role="status" aria-label="Loading">
            <FieldsRow count={2} grid="sm:grid-cols-[1fr_9rem]" />
            <div className="mb-4">
              <Bar className="mb-2 h-5 w-20 rounded-full" />
              <Bar className="h-14 rounded-control" />
            </div>
            <FieldsRow count={2} grid="sm:grid-cols-2" />
          </div>
        </Card>
      ) : (
        <div key={tab}>
          {tab === "smtp" && <SmtpTab smtp={data.smtp} />}
          {tab === "users" && <UsersTab allowRegistration={data.allow_registration} />}
          {tab === "storage" && <StorageTab retentionDays={data.retention_days} />}
        </div>
      )}
    </>
  );
}
