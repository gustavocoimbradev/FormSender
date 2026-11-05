/** Where Mailpit (the local inbox that catches every email) is reachable, or null when this environment has none. */
export function mailpitPublicUrl(): string | null {
  const port = process.env.NEXT_PUBLIC_MAILPIT_PORT;
  return port ? `${window.location.protocol}//${window.location.hostname}:${port}` : null;
}

/** Where the backend is reachable from the browser (the API docs live at its root). */
export function apiPublicUrl(): string {
  const port = process.env.NEXT_PUBLIC_API_PORT ?? "8000";
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}
