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

  return /^[a-z]/.test(slug) ? slug.slice(0, 100) : slug ? `campo_${slug}`.slice(0, 100) : "";
}
