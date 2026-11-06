import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
};

const PRIMARY =
  "inline-flex h-14 w-full items-center justify-center gap-3 rounded-control bg-gradient-to-r from-accent to-[#6f8cff] px-6 text-base font-semibold text-white transition duration-300 ease-out hover:brightness-110 active:brightness-95";

/** Primary action. Hover changes brightness only; it never moves. */
export function Button({ loading = false, loadingLabel, disabled, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${PRIMARY} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ${className}`}
    >
      {loading && <Spinner />}
      <span>{loading ? loadingLabel ?? children : children}</span>
    </button>
  );
}

/** The primary action, for navigation. */
export function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={PRIMARY}>
      {children}
    </Link>
  );
}

/** A quiet action, for things like signing out. */
export function GhostButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-14 w-full items-center justify-center rounded-control border border-surface/15 px-6 text-base font-medium text-text transition duration-300 ease-out hover:bg-surface/[0.06] ${className}`}
    />
  );
}

const ACTION = "inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control px-5 text-base font-medium transition duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40";

const VARIANTS = {
  primary: "bg-gradient-to-r from-accent to-[#6f8cff] font-semibold text-white hover:brightness-110",
  ghost: "border border-surface/15 text-text hover:bg-surface/[0.06]",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
} as const;

type Variant = keyof typeof VARIANTS;

/** On phones the action shrinks to a perfectly round icon button (44px); the label stays for screen readers. */
const ROUND_ON_PHONE = "max-sm:w-11 max-sm:rounded-full max-sm:px-0";

export function PhoneLabel({ children }: { children: ReactNode }) {
  return <span className="max-sm:sr-only">{children}</span>;
}

/** A compact action for page headers, tables and dialogs. */
export function ActionButton({
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  roundOnPhone = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; roundOnPhone?: boolean }) {
  return (
    <button {...props} disabled={disabled || loading} aria-busy={loading} className={`${ACTION} ${VARIANTS[variant]} ${roundOnPhone ? ROUND_ON_PHONE : ""} ${className}`}>
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

export function ActionLink({ href, variant = "primary", children, target, rel, roundOnPhone = false, className = "" }: { href: string; variant?: Variant; children: ReactNode; target?: string; rel?: string; roundOnPhone?: boolean; className?: string }) {
  const classes = `${ACTION} ${VARIANTS[variant]} ${roundOnPhone ? ROUND_ON_PHONE : ""} ${className}`;

  return target ? (
    <a href={href} target={target} rel={rel} className={classes}>
      {children}
    </a>
  ) : (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
