"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Bar } from "./Skeleton";

/** Where the fixed phone header shows the current screen's title and main action (see AppShell). */
export const PHONE_HEADER_SLOT = "phone-header-slot";

/** True below the width where the navigation becomes a bottom bar and the header takes over the title. */
export function usePhoneLayout(): boolean {
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

/** `title` is null while the screen's own name (a form, a template) is still loading. */
export function PageHeader({ title, children, back }: { title: string | null; children?: ReactNode; back?: ReactNode }) {
  const phone = usePhoneLayout();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(PHONE_HEADER_SLOT));
  }, [phone]);

  if (phone) {
    return (
      <>
        {slot &&
          createPortal(
            <>
              {title === null ? (
                <Bar className="col-start-2 row-start-1 h-6 w-32 justify-self-center rounded-full" />
              ) : (
                <h1 className="relative col-start-2 row-start-1 max-w-[calc(100vw-10rem)] truncate text-center text-xl font-semibold tracking-tight">{title}</h1>
              )}
              {children && <div className="relative col-start-3 row-start-1 flex items-center gap-2 justify-self-end max-sm:[&>*]:!border-0 max-sm:[&>*]:!bg-transparent max-sm:[&>*]:!bg-none max-sm:[&>*]:!text-text max-sm:[&>*]:hover:!bg-surface/10 max-sm:[&_svg]:size-6">{children}</div>}
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
        {title === null ? <Bar className="my-1 h-8 w-56 rounded-full" /> : <h1 className="truncate text-3xl font-semibold tracking-tight">{title}</h1>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
