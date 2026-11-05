import type { Config } from "tailwindcss";

// Every color is a CSS variable holding an "R G B" triplet (see globals.css),
// so opacity utilities such as `bg-accent/20` keep working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        "bg-soft": token("bg-soft"),
        surface: token("surface"),
        text: token("text"),
        muted: token("muted"),
        accent: token("accent"),
        "accent-2": token("accent-2"),
        danger: token("danger"),
        success: token("success"),
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        spin: { to: { transform: "rotate(360deg)" } },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(4%, -6%, 0) scale(1.08)" },
        },
        travel: {
          "0%": { left: "6%", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { left: "94%", opacity: "0" },
        },
        draw: { to: { strokeDashoffset: "0" } },
        pop: {
          from: { opacity: "0", transform: "scale(0.97) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "sheet-up": {
          from: { opacity: "0", transform: "translateY(32px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        ring: {
          from: { transform: "scale(0.6)", opacity: "0.7" },
          to: { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        "fade-up": "fade-up 520ms var(--ease-out) both",
        "fade-in": "fade-in 400ms var(--ease-out) both",
        shake: "shake 380ms var(--ease-out)",
        shimmer: "shimmer 1.8s linear infinite",
        spin: "spin 700ms linear infinite",
        drift: "drift 16s ease-in-out infinite",
        travel: "travel 3.2s ease-in-out infinite",
        draw: "draw 520ms var(--ease-out) 180ms forwards",
        pop: "pop 280ms var(--ease-out) both",
        "slide-in": "slide-in 360ms var(--ease-out) both",
        "sheet-up": "sheet-up 320ms var(--ease-out) both",
        ring: "ring 1.4s var(--ease-out) 120ms both",
      },
    },
  },
  plugins: [],
};

export default config;
