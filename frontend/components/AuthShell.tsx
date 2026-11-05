import type { ReactNode } from "react";
import { AmbientBackground } from "./AmbientBackground";
import { Logo } from "./Logo";

/** The simple centered box shared by the setup, login and entry screens. */
export function AuthShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <main className="relative grid min-h-dvh place-items-center px-5 py-10 sm:px-10">
      <AmbientBackground />

      <section className={`w-full ${wide ? "max-w-[36rem]" : "max-w-[28rem]"}`}>
        <div className="mb-8 flex animate-fade-in justify-center">
          <Logo />
        </div>

        <div className="animate-fade-up rounded-card border border-surface/10 bg-surface/[0.04] p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)] backdrop-blur-xl sm:p-8">
          {children}
        </div>
      </section>
    </main>
  );
}
