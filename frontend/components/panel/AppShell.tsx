"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { apiPublicUrl, mailpitPublicUrl } from "@/lib/config";
import { isAdmin, roleLabel } from "@/lib/permissions";
import { AmbientBackground } from "../AmbientBackground";
import { BookIcon, ExternalIcon, FormsIcon, InboxIcon, LogoutIcon, ServerIcon, TemplateIcon, UsersIcon } from "../icons";
import { Logo, LogoMark } from "../Logo";
import { Spinner } from "../Spinner";
import { useSession } from "./PanelFrame";

type NavItem = { href: string; label: string; icon: ReactNode; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/forms", label: "Forms", icon: <FormsIcon /> },
  { href: "/templates", label: "Templates", icon: <TemplateIcon /> },
  { href: "/users", label: "Users", icon: <UsersIcon />, adminOnly: true },
  { href: "/smtp", label: "SMTP", icon: <ServerIcon />, adminOnly: true },
];

const MENU_LINK = "flex h-12 items-center gap-3 rounded-control px-3 text-base text-text transition-colors duration-300 hover:bg-surface/[0.08]";

const ROUND = "group relative z-10 grid size-12 shrink-0 place-items-center rounded-full transition-colors duration-300";

/** The name of an icon-only item, shown beside it on hover or focus (large screens). */
function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-control border border-surface/15 bg-[#12121f] px-3 py-2 text-base text-text opacity-0 shadow-[0_20px_50px_-20px_rgb(0_0_0/1)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block"
    >
      {children}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-2 text-lg font-semibold text-bg">
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

/** Only the avatar. The name, the role and the way out open when it is clicked. */
function UserMenu() {
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [docsUrl, setDocsUrl] = useState("/");
  const [mailpitUrl, setMailpitUrl] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDocsUrl(`${apiPublicUrl()}/`);
    setMailpitUrl(mailpitPublicUrl());
  }, []);

  useEffect(() => {
    if (!open) return;

    const away = (event: MouseEvent) => !box.current?.contains(event.target as Node) && setOpen(false);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="User menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-12 place-items-center rounded-full ring-2 ring-surface/10 transition duration-300 hover:ring-accent/60"
      >
        <Avatar name={user.name || user.email} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-50 mb-4 w-64 animate-pop rounded-card border border-surface/15 bg-[#12121f] p-4 shadow-[0_30px_80px_-20px_rgb(0_0_0/1)] lg:bottom-0 lg:left-full lg:right-auto lg:mb-0 lg:ml-5"
        >
          <p className="truncate text-base font-semibold" title={user.name}>
            {user.name}
          </p>
          <p className="truncate text-base text-muted" title={user.email}>
            {user.email}
          </p>
          <p className="mt-1 text-base text-accent">{roleLabel(user)}</p>

          <div className="mt-3 border-t border-surface/10 pt-2">
            <a href={docsUrl} target="_blank" rel="noopener noreferrer" role="menuitem" className={MENU_LINK}>
              <BookIcon /> Documentation <ExternalIcon className="ml-auto size-4 text-muted" />
            </a>
            {/* The local inbox, for developers: it shows every email the system sends, so only administrators get it. */}
            {mailpitUrl && isAdmin(user) && (
              <a href={mailpitUrl} target="_blank" rel="noopener noreferrer" role="menuitem" className={MENU_LINK}>
                <InboxIcon /> Mailpit <ExternalIcon className="ml-auto size-4 text-muted" />
              </a>
            )}
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={signingOut}
            aria-busy={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut();
            }}
            className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-surface/10 text-base font-medium text-text transition-colors duration-300 hover:bg-surface/[0.16] disabled:cursor-wait disabled:opacity-70 disabled:hover:bg-surface/10"
          >
            {signingOut ? <Spinner /> : <LogoutIcon />}
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * The round navigation. The highlight is one circle that slides to the chosen
 * item, stretching along the way and settling back (vertical on large screens,
 * horizontal on the phone's bottom bar).
 */
function NavRail() {
  const pathname = usePathname();
  const { user } = useSession();
  const nav = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const items = useRef(new Map<string, HTMLElement>());
  const last = useRef<{ x: number; y: number }>();

  const visible = NAV.filter((item) => !item.adminOnly || isAdmin(user));
  const active = visible.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;

  useLayoutEffect(() => {
    const circle = indicator.current;
    if (!circle) return;

    const target = active ? items.current.get(active) : undefined;
    if (!target) {
      circle.style.opacity = "0";
      last.current = undefined;
      return;
    }

    const to = { x: target.offsetLeft, y: target.offsetTop };
    const from = last.current;
    circle.style.opacity = "1";

    if (from && (from.x !== to.x || from.y !== to.y) && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const stretch = Math.min(1 + Math.hypot(dx, dy) / 70, 2.4);
      const squash = 1 / Math.sqrt(stretch);
      const horizontal = Math.abs(dx) > Math.abs(dy);

      circle.animate(
        [
          { transform: `translate(${from.x}px, ${from.y}px) scale(1, 1)`, offset: 0 },
          {
            transform: `translate(${from.x + dx / 2}px, ${from.y + dy / 2}px) scale(${horizontal ? stretch : squash}, ${horizontal ? squash : stretch})`,
            offset: 0.45,
          },
          { transform: `translate(${to.x}px, ${to.y}px) scale(1, 1)`, offset: 1 },
        ],
        { duration: 560, easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
      );
    }

    circle.style.transform = `translate(${to.x}px, ${to.y}px)`;
    last.current = to;
  }, [active, visible.length]);

  // Switching between the side rail and the bottom bar moves the items: follow them.
  useEffect(() => {
    const follow = () => {
      const target = active ? items.current.get(active) : undefined;
      if (!target || !indicator.current) return;
      last.current = { x: target.offsetLeft, y: target.offsetTop };
      indicator.current.style.transform = `translate(${last.current.x}px, ${last.current.y}px)`;
    };

    window.addEventListener("resize", follow);
    return () => window.removeEventListener("resize", follow);
  }, [active]);

  return (
    <nav aria-label="Principal" ref={nav} className="relative flex flex-1 items-center justify-around lg:flex-col lg:justify-start lg:gap-3">
      <span
        ref={indicator}
        aria-hidden="true"
        data-testid="nav-indicator"
        className="pointer-events-none absolute left-0 top-0 size-12 rounded-full bg-accent opacity-0 shadow-[0_10px_30px_-8px_rgb(var(--accent)/0.8)]"
      />

      {visible.map((item) => {
        const isActive = item.href === active;

        return (
          <Link
            key={item.href}
            href={item.href}
            ref={(element) => {
              if (element) items.current.set(item.href, element);
            }}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`${ROUND} ${isActive ? "text-white" : "text-muted hover:text-text"}`}
          >
            {item.icon}
            <Tooltip>{item.label}</Tooltip>
          </Link>
        );
      })}
    </nav>
  );
}

/** A slim rail of round icons on large screens, a bottom bar on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[6.5rem_1fr]">
      <AmbientBackground />

      <header className="flex items-center px-4 py-3 lg:hidden">
        <Link href="/" aria-label="FormSender, home">
          <Logo size="sm" />
        </Link>
      </header>

      <aside className="fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md lg:sticky lg:inset-auto lg:bottom-auto lg:top-0 lg:mx-0 lg:h-dvh lg:max-w-none lg:p-4">
        <div className="flex items-center gap-2 rounded-full border border-surface/10 bg-[#0c0c18]/90 p-2 shadow-[0_20px_60px_-20px_rgb(0_0_0/1)] backdrop-blur-xl lg:h-full lg:flex-col lg:rounded-[2rem] lg:bg-surface/[0.04] lg:px-0 lg:py-5">
          <Link href="/" aria-label="FormSender, home" className="hidden rounded-full p-2 transition-opacity duration-300 hover:opacity-80 lg:mb-4 lg:mt-1 lg:block">
            <LogoMark className="size-8" />
          </Link>

          <NavRail />

          <UserMenu />
        </div>
      </aside>

      <main className="min-w-0 px-4 pb-32 pt-2 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
