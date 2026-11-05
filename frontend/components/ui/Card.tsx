import type { ReactNode } from "react";

/** The glass panel that holds a table or a form. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-surface/10 bg-surface/[0.04] shadow-[0_30px_80px_-40px_rgb(0_0_0/0.9)] backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </header>
  );
}
