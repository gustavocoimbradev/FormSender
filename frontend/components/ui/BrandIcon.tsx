import {
  siAstro,
  siHtml5,
  siJavascript,
  siLaravel,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPython,
  siReact,
  siSvelte,
  siVuedotjs,
  siWordpress,
  type SimpleIcon,
} from "simple-icons";

const ICONS: Record<string, SimpleIcon> = {
  html: siHtml5,
  javascript: siJavascript,
  react: siReact,
  next: siNextdotjs,
  vue: siVuedotjs,
  svelte: siSvelte,
  astro: siAstro,
  php: siPhp,
  laravel: siLaravel,
  wordpress: siWordpress,
  node: siNodedotjs,
  python: siPython,
};

/** A technology's logo, always in the text color and the same size, so a list of them looks like one set. */
export function BrandIcon({ id }: { id: string }) {
  const icon = ICONS[id];
  if (!icon) return null;

  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}
