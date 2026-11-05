const TOKEN_KEY = "formsender.token";
const USER_KEY = "formsender.user";

/** What the panel needs to draw itself right away, before the API confirms the session. */
export type CachedUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  is_owner: boolean;
};

/** The API token of the signed-in user, kept in this browser. */
export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable (private mode): the session just will not persist */
  }
}

export function getCachedUser(): CachedUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CachedUser) : null;
  } catch {
    return null;
  }
}

export function saveUser(user: CachedUser): void {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* nothing to clear */
  }
}
