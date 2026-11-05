import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateDetailScreen } from "@/components/templates/TemplateScreens";

export const metadata: Metadata = { title: "Template · FormSender" };

export default function TemplatePage({ params }: { params: { code: string } }) {
  if (!/^[a-z0-9]{10,32}$/.test(params.code)) notFound();

  return <TemplateDetailScreen code={params.code} />;
}
