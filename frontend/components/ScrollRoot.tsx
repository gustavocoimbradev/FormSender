"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Where the page scrolls (with a mouse; on a touch screen the page scrolls as usual). It is a box of its own, so its
 * scrollbar sits on top of the background instead of in a strip beside it, and the glows show through.
 * See `.scroll-root` in globals.css.
 */
export function ScrollRoot({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // A new screen starts at the top (the box stays in place between screens, unlike the page).
  useEffect(() => {
    box.current?.scrollTo(0, 0);
  }, [pathname]);

  // The keyboard (space, page down, home, end) scrolls what has the focus: give it to the box, unless something took it.
  useEffect(() => {
    if (document.activeElement === document.body) box.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={box} id="scroll-root" tabIndex={-1} className="scroll-root focus:outline-none focus-visible:ring-0">
      {children}
    </div>
  );
}
