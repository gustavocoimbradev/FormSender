import { AmbientBackground } from "./AmbientBackground";
import { Logo } from "./Logo";

/** A neutral screen for the instant before we know where the person goes: just the brand, no login card. */
export function Splash() {
  return (
    <div data-testid="splash" className="relative grid min-h-dvh place-items-center">
      <AmbientBackground />
      <Logo className="animate-pulse" />
    </div>
  );
}
