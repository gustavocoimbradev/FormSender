import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicFormScreen } from "@/components/public/PublicFormScreen";

// A form's own page is for the people it was shared with: search engines have no business listing it.
export const metadata: Metadata = { title: "Form", robots: { index: false, follow: false } };

/**
 * One address for everything: opened directly it is the form's page, with our logo and credit; inside an
 * iframe it is only the form.
 */
export default function PublicFormPage({ params }: { params: { code: string } }) {
  if (!/^[a-z0-9]{10,32}$/.test(params.code)) notFound();

  return <PublicFormScreen code={params.code} />;
}
