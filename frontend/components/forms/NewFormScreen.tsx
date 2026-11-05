"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "../ui/PageHeader";
import { BackLink } from "./FormDetailScreen";
import { FormEditor } from "./FormEditor";

export function NewFormScreen() {
  const router = useRouter();

  return (
    <>
      <PageHeader title="Novo formulário" back={<BackLink />} />
      <FormEditor onSaved={(form) => router.push(`/forms/${form.code}?tab=integration`)} />
    </>
  );
}
