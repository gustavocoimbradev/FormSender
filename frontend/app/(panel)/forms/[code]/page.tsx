import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormDetailScreen } from "@/components/forms/FormDetailScreen";

export const metadata: Metadata = { title: "Formulário · FormSender" };

const TABS = ["config", "integration", "messages", "test"] as const;

export default function FormPage({ params, searchParams }: { params: { code: string }; searchParams: { tab?: string } }) {
  if (!/^[a-z0-9]{10,32}$/.test(params.code)) notFound();

  const tab = TABS.find((candidate) => candidate === searchParams.tab) ?? "config";

  return <FormDetailScreen code={params.code} initialTab={tab} />;
}
