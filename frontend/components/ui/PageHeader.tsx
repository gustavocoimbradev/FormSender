import type { ReactNode } from "react";

export function PageHeader({ title, children, back }: { title: string; children?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6 flex animate-fade-up flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="truncate text-3xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
