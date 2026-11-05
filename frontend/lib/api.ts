/**
 * Typed client for the FormSender API. Requests go to the same-origin `/api`
 * proxy (see next.config.mjs), so the browser never deals with CORS.
 */

export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  is_owner: boolean;
};

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 when the API could not be reached. */
    readonly status: number,
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorBody = { message?: string; errors?: FieldErrors };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, "A API não respondeu.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(response.status, body.message ?? "Erro inesperado.", body.errors);
  }

  return (await response.json()) as T;
}

/** Whether the first admin account already exists. */
export async function getSetupStatus(): Promise<boolean> {
  const { data } = await request<{ data: { completed: boolean } }>("/setup");
  return data.completed;
}

/** Creates the initial admin (the owner). Only works while the setup is pending. */
export async function createInitialAdmin(payload: {
  email: string;
  password: string;
}): Promise<User> {
  const { data } = await request<{ data: User }>("/setup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}
