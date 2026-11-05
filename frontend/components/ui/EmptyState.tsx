import type { ReactNode } from "react";

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex animate-fade-up flex-col items-center px-6 py-14 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-accent/10 text-accent [&>svg]:size-8">{icon}</span>
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-base leading-relaxed text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
