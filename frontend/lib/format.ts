const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" });
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function formatDateTime(value: string | null): string {
  return value ? dateTime.format(new Date(value)) : "–";
}

export function formatDate(value: string | null): string {
  return value ? date.format(new Date(value)) : "–";
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** "Contato Principal" -> "contato_principal" (a safe field name). */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return /^[a-z]/.test(slug) ? slug.slice(0, 100) : slug ? `field_${slug}`.slice(0, 100) : "";
}

/** A file size people can read: 340 KB, 2.1 MB. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
