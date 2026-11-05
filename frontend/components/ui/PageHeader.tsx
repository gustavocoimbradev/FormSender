"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Where the fixed phone header shows the current screen's title and main action (see AppShell). */
export const PHONE_HEADER_SLOT = "phone-header-slot";

/** True below the width where the navigation becomes a bottom bar and the header takes over the title. */
function usePhoneLayout(): boolean {
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return phone;
}

export function PageHeader({ title, children, back }: { title: string; children?: ReactNode; back?: ReactNode }) {
  const phone = usePhoneLayout();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(PHONE_HEADER_SLOT));
  }, [phone]);

  if (phone) {
    return (
      <>
        {back && <div className="mb-2 animate-fade-up">{back}</div>}
        {slot &&
          createPortal(
            <>
              <h1 className="relative col-start-2 row-start-1 max-w-[calc(100vw-10rem)] truncate text-center text-xl font-semibold tracking-tight">{title}</h1>
              {children && <div className="relative col-start-3 row-start-1 flex items-center gap-2 justify-self-end">{children}</div>}
            </>,
            slot,
          )}
      </>
    );
  }

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
