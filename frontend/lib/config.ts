/** Where Mailpit (the local inbox that catches every email) is reachable, or null when this environment has none. */
export function mailpitPublicUrl(): string | null {
  const port = process.env.NEXT_PUBLIC_MAILPIT_PORT;
  return port ? `${window.location.protocol}//${window.location.hostname}:${port}` : null;
}

/** Where the backend is reachable from the browser (the API docs live at its /docs). */
export function apiPublicUrl(): string {
  const port = process.env.NEXT_PUBLIC_API_PORT;

  // Development: the API has a port of its own. In production everything lives at one address, so the API is where the panel is.
  return port ? `${window.location.protocol}//${window.location.hostname}:${port}` : window.location.origin;
}

/** Where Form Sender itself lives: the public page of a form credits it. */
export const PROJECT_URL = "https://github.com/gustavocoimbradev/form-sender";
