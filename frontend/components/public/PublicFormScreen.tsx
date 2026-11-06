"use client";

import { useEffect, useState } from "react";
import { apiPublicUrl, PROJECT_URL } from "@/lib/config";
import { AmbientBackground } from "../AmbientBackground";
import { Logo } from "../Logo";
import { Spinner } from "../Spinner";

type State = { status: "loading" } | { status: "ready"; name: string } | { status: "missing" } | { status: "unavailable" };

type PublicFormScreenProps = {
  code: string;
  /** Colors of the form when it is inside an iframe (opened directly, the page is always dark, like the platform). */
  theme: "light" | "dark";
};

/**
 * A form's own page: the same form every website gets from the embed script, drawn by that very script,
 * so what you see here is what a visitor sees anywhere. It works on any screen, and nothing here needs a login.
 * Opened directly it carries our logo and credit; inside an iframe it is just the form. It is one address for
 * both, so a link meant for a frame cannot be used to show the form without our name.
 */
export function PublicFormScreen({ code, theme }: PublicFormScreenProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  // Known only in the browser. Until then nothing is drawn, so neither version flashes.
  const [embedded, setEmbedded] = useState<boolean | null>(null);
  const formTheme = embedded ? theme : "dark";

  useEffect(() => setEmbedded(window.self !== window.top), []);

  // The title comes from the form (through the same-origin /api proxy); the form itself is drawn by the script.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/forms/${code}/public`, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 404) return setState({ status: "missing" });
        if (!response.ok) return setState({ status: "unavailable" });

        const { data } = (await response.json()) as { data: { name: string } };
        document.title = data.name;
        setState({ status: "ready", name: data.name });
      })
      .catch(() => !cancelled && setState({ status: "unavailable" }));

    return () => {
      cancelled = true;
    };
  }, [code]);

  // An iframe paints its own solid background, so it matches the form whatever the site around it looks like.
  useEffect(() => {
    if (embedded !== true) return;

    const { documentElement, body } = document;
    const previous = [documentElement.style.colorScheme, documentElement.style.background, body.style.background];
    const background = theme === "dark" ? "#07070d" : "#ffffff";

    documentElement.style.colorScheme = theme;
    documentElement.style.background = background;
    body.style.background = background;

    return () => {
      [documentElement.style.colorScheme, documentElement.style.background, body.style.background] = previous;
    };
  }, [embedded, theme]);

  useEffect(() => {
    if (state.status !== "ready" || embedded === null) return;

    const script = document.createElement("script");
    script.src = `${apiPublicUrl()}/embed.js`;
    script.async = true;
    script.dataset.form = code;
    script.dataset.theme = formTheme;
    script.dataset.target = "#public-form";
    document.body.appendChild(script);

    return () => {
      script.remove();
      document.getElementById("public-form")?.replaceChildren();
    };
  }, [state.status, embedded, code, formTheme]);

  if (embedded === null) return <main className="min-h-dvh" />;

  if (embedded) {
    return (
      <main className={`min-h-dvh p-1 ${theme === "dark" ? "text-text" : "text-[#14141f]"}`}>
        {state.status === "loading" && (
          <div role="status" aria-label="Loading" className="grid place-items-center py-10">
            <Spinner className="size-6" />
          </div>
        )}
        {state.status === "ready" && <div id="public-form" />}
        {(state.status === "missing" || state.status === "unavailable") && <p role="alert" className="py-6 text-base">This form is not available.</p>}
      </main>
    );
  }

  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-10 sm:px-10">
      <AmbientBackground />

      <div className="w-full max-w-[36rem]">
        <div className="mb-8 flex animate-fade-in justify-center">
          <Logo />
        </div>

        <section className="animate-fade-up rounded-card border border-surface/10 bg-surface/[0.04] p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:p-8">
          {state.status === "loading" && (
            <div role="status" aria-label="Loading" className="grid place-items-center py-10">
              <Spinner className="size-6" />
            </div>
          )}

          {state.status === "ready" && <div id="public-form" className="text-text" />}

          {state.status === "missing" && (
            <div className="py-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Form not found</h1>
              <p className="mt-2 text-base leading-relaxed text-muted">The link may be wrong, or the form was removed.</p>
            </div>
          )}

          {state.status === "unavailable" && (
            <div role="alert" className="py-6 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">This form is not available</h1>
              <p className="mt-2 text-base leading-relaxed text-muted">Please try again in a moment.</p>
            </div>
          )}
        </section>

        <p className="mt-6 animate-fade-in text-center text-base text-muted">
          Powered by{" "}
          <a href={PROJECT_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-text underline-offset-4 transition-colors duration-300 hover:underline">
            Form Sender
          </a>
        </p>
      </div>
    </main>
  );
}
