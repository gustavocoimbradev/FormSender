"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CloseIcon } from "../icons";

type Tone = "success" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => undefined);

export const useToast = () => useContext(ToastContext);

/** Small confirmations that slide in and leave on their own. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  const push = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = next.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex w-full max-w-sm animate-slide-in items-center gap-3 rounded-control border px-4 py-3 text-base shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] backdrop-blur-xl ${
              toast.tone === "error" ? "border-danger/40 bg-[#2a1118]/95 text-text" : "border-success/40 bg-[#0f2219]/95 text-text"
            }`}
          >
            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${toast.tone === "error" ? "bg-danger/20 text-danger" : "bg-success/20 text-success"}`}>
              {toast.tone === "error" ? <CloseIcon className="size-4" /> : <CheckIcon className="size-4" />}
            </span>
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
