import { useId } from "react";

/** The mark: an arrowhead pointing right, like the ➤ used in text, with no tile behind it. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  const gradient = useId();

  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="4" y1="20" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--accent))" />
          <stop offset="1" stopColor="#6f8cff" />
        </linearGradient>
      </defs>
      <path d="M35 20 7 7l8 13-8 13Z" fill={`url(#${gradient})`} stroke={`url(#${gradient})`} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <span className={`inline-flex items-center ${size === "sm" ? "gap-2" : "gap-3"} ${className}`}>
      <LogoMark className={size === "sm" ? "size-7" : "size-9"} />
      <span className={`${size === "sm" ? "text-lg" : "text-2xl"} font-semibold tracking-tight`}>FormSender</span>
    </span>
  );
}
