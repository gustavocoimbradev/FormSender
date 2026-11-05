import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
};

/** Primary action. Hover changes brightness only; it never moves. */
export function Button({ loading = false, loadingLabel, disabled, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex h-14 w-full items-center justify-center gap-3 rounded-control bg-gradient-to-r from-accent to-[#6f8cff] px-6 text-base font-semibold text-white transition duration-300 ease-out hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 ${className}`}
    >
      {loading && <Spinner />}
      <span>{loading ? loadingLabel ?? children : children}</span>
    </button>
  );
}
