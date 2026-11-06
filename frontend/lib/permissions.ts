import type { ManagedUser, User } from "./api";

/** Mirrors the backend rules (UserPolicy) so the interface only offers what will be accepted. */
export const isAdmin = (user: Pick<User, "role">) => user.role === "admin";

/** Only the administrator manages accounts. */
export const canEditUser = (actor: User): boolean => isAdmin(actor);

/** The administrator removes any account, but never their own. */
export const canDeleteUser = (actor: User, target: ManagedUser): boolean => isAdmin(actor) && actor.id !== target.id;

export const roleLabel = (user: Pick<User, "role">): string => (user.role === "admin" ? "Administrator" : "User");
