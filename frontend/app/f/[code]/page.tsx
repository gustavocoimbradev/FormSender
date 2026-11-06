import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicFormScreen } from "@/components/public/PublicFormScreen";

// A form's own page is for the people it was shared with: search engines have no business listing it.
export const metadata: Metadata = { title: "Form", robots: { index: false, follow: false } };

/**
 * One address for everything: opened directly it is the form's page, with our logo and credit; inside an
 * iframe it is only the form. `theme=dark` paints the framed form dark (light is the default).
 */
export default function PublicFormPage({ params, searchParams }: { params: { code: string }; searchParams: { theme?: string } }) {
  if (!/^[a-z0-9]{10,32}$/.test(params.code)) notFound();

  return <PublicFormScreen code={params.code} theme={searchParams.theme === "dark" ? "dark" : "light"} />;
}
