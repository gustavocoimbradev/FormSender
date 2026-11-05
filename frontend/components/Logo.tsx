import { useId } from "react";

/** The mark: a loose paper plane, no tile behind it. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  const gradient = useId();

  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="4" y1="36" x2="36" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="rgb(var(--accent-2))" />
        </linearGradient>
      </defs>
      <g stroke={`url(#${gradient})`} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 4 17.5 22.5" />
        <path d="M36 4 24.5 36l-7-13.5L4 15.5 36 4Z" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark />
      <span className="text-2xl font-semibold tracking-tight">FormSender</span>
    </span>
  );
}
