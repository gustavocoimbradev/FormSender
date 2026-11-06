import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormDetailScreen } from "@/components/forms/FormDetailScreen";

export const metadata: Metadata = { title: "Form · FormSender" };

const TABS = ["general", "fields", "delivery", "embed", "messages", "test"] as const;

export default function FormPage({ params, searchParams }: { params: { code: string }; searchParams: { tab?: string } }) {
  if (!/^[a-z0-9]{10,32}$/.test(params.code)) notFound();

  const tab = TABS.find((candidate) => candidate === searchParams.tab) ?? "general";

  return <FormDetailScreen code={params.code} initialTab={tab} />;
}
