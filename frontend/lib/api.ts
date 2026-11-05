import { clearToken, getToken } from "./session";

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

export type SmtpSettings = {
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  encryption: "ssl" | "tls" | null;
  from_address: string;
  from_name: string | null;
};

export type FieldType = "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "date";

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[] | null;
};

export type Form = {
  name: string;
  fields: FormField[];
  destinations: string[];
  allowed_domains: string[];
  /** Code of the email template, or null when the form uses the default one. */
  template: string | null;
  /** The form's unique code: it identifies the form in every address, in the panel and on the websites that send it. */
  code: string;
  created_at: string | null;
  updated_at: string | null;
};

export type FormInput = Pick<Form, "name" | "fields" | "destinations" | "allowed_domains" | "template">;

export type SubmissionStatus = "pending" | "processing" | "sent" | "partial" | "failed";

export type Delivery = {
  destination: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sent_at: string | null;
};

export type Submission = {
  id: number;
  form_name: string;
  status: SubmissionStatus;
  values: Record<string, unknown>;
  destinations: string[];
  deliveries: Delivery[];
  attempts: number;
  error: string | null;
  ip: string | null;
  origin: string | null;
  user_agent: string | null;
  created_at: string | null;
  processed_at: string | null;
};

export type Template = {
  code: string;
  name: string;
  subject: string;
  html: string;
  is_default: boolean;
  forms_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type TemplateInput = Pick<Template, "name" | "subject" | "html">;

export type ManagedUser = User & { created_at: string | null; updated_at: string | null };

export type UserInput = { name?: string; email?: string; password?: string; role?: "admin" | "user" };

export type Page<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null };
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

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/** A request made as the signed-in user. A 401 means the session is over: back to the login. */
async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();

  if (!token) {
    window.location.assign("/login");
    throw new ApiError(401, "Sessão encerrada.");
  }

  try {
    return await request<T>(path, init, token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      clearToken();
      window.location.assign("/login");
    }
    throw error;
  }
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

/** Whether the first admin account already exists. */
export async function getSetupStatus(): Promise<boolean> {
  const { data } = await request<{ data: { completed: boolean } }>("/setup");
  return data.completed;
}

/** Creates the initial admin (the owner). Only works while the setup is pending. */
export async function createInitialAdmin(payload: {
  email: string;
  password: string;
  smtp?: SmtpSettings;
}): Promise<User> {
  const { data } = await request<{ data: User }>("/setup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data;
}

/** Logs in. The token goes in `Authorization: Bearer <token>` on later calls. */
export async function login(payload: { email: string; password: string }): Promise<{ token: string; user: User }> {
  const body = await request<{ token: string; data: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { token: body.token, user: body.data };
}

/** The user a token belongs to. Fails with 401 when the token is no longer valid. */
export async function getCurrentUser(token: string): Promise<User> {
  const { data } = await request<{ data: User }>("/auth/me", {}, token);
  return data;
}

/** Revokes the token on the server. */
export async function logout(token: string): Promise<void> {
  await request<void>("/auth/logout", { method: "POST" }, token);
}

// ------------------------------------------------------------------ forms

export const listForms = (page = 1) => authed<Page<Form>>(`/forms?page=${page}`);

export const getForm = async (code: string) => (await authed<{ data: Form }>(`/forms/${code}`)).data;

export const createForm = async (input: FormInput) => (await authed<{ data: Form }>("/forms", json("POST", input))).data;

export const updateForm = async (code: string, input: FormInput) =>
  (await authed<{ data: Form }>(`/forms/${code}`, json("PUT", input))).data;

export const deleteForm = (code: string) => authed<void>(`/forms/${code}`, { method: "DELETE" });

/** Sends a test message through the form (the panel's own action: it ignores the allowed sites). */
export const sendTestMessage = (code: string, values: Record<string, unknown>) =>
  authed<{ message: string; data: { id: number; status: SubmissionStatus } }>(`/forms/${code}/test`, json("POST", values));

export const listSubmissions = (formCode: string, page = 1, status?: SubmissionStatus) =>
  authed<Page<Submission>>(`/forms/${formCode}/submissions?page=${page}${status ? `&status=${status}` : ""}`);

// ------------------------------------------------------------------ templates

export const listTemplates = async () => (await authed<{ data: Template[] }>("/templates")).data;

export const getTemplate = async (code: string) => (await authed<{ data: Template }>(`/templates/${code}`)).data;

export const createTemplate = async (input: TemplateInput) => (await authed<{ data: Template }>("/templates", json("POST", input))).data;

export const updateTemplate = async (code: string, input: TemplateInput) =>
  (await authed<{ data: Template }>(`/templates/${code}`, json("PUT", input))).data;

export const deleteTemplate = (code: string) => authed<void>(`/templates/${code}`, { method: "DELETE" });

/** The subject and HTML filled with example data, exactly as a real message would be. */
export const previewTemplate = async (input: Pick<TemplateInput, "subject" | "html">) =>
  (await authed<{ data: { subject: string; html: string } }>("/templates/preview", json("POST", input))).data;

// ------------------------------------------------------------------ users (admin)

export const listUsers = (page = 1) => authed<Page<ManagedUser>>(`/users?page=${page}`);

export const createUser = async (input: Required<Pick<UserInput, "name" | "email" | "password">> & Pick<UserInput, "role">) =>
  (await authed<{ data: ManagedUser }>("/users", json("POST", input))).data;

export const updateUser = async (id: number, input: UserInput) =>
  (await authed<{ data: ManagedUser }>(`/users/${id}`, json("PATCH", input))).data;

export const deleteUser = (id: number) => authed<void>(`/users/${id}`, { method: "DELETE" });

// ------------------------------------------------------------------ settings (admin)

export const getSmtp = async () => (await authed<{ data: { smtp: SmtpSettings | null } }>("/settings")).data.smtp;

export const saveSmtp = async (smtp: SmtpSettings) =>
  (await authed<{ data: { smtp: SmtpSettings | null } }>("/settings", json("PUT", { smtp }))).data.smtp;
