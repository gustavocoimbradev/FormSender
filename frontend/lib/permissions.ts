import type { ManagedUser, User } from "./api";

/** Mirrors the backend rules (UserPolicy) so the interface only offers what will be accepted. */
export const isAdmin = (user: User) => user.role === "admin";

/** Admins edit regular users and themselves; other admins and the owner only the owner (or themselves). */
export function canEditUser(actor: User, target: ManagedUser): boolean {
  return isAdmin(actor) && (actor.id === target.id || target.role === "user" || actor.is_owner);
}

/** Nobody changes their own or the owner's role; only the owner changes another admin's. */
export function canChangeRole(actor: User, target: ManagedUser): boolean {
  return isAdmin(actor) && actor.id !== target.id && !target.is_owner && (target.role === "user" || actor.is_owner);
}

/** Nobody deletes themselves or the owner; only the owner deletes other admins. */
export function canDeleteUser(actor: User, target: ManagedUser): boolean {
  return isAdmin(actor) && actor.id !== target.id && !target.is_owner && (target.role === "user" || actor.is_owner);
}

export function roleLabel(user: Pick<User, "role" | "is_owner">): string {
  if (user.is_owner) return "Owner administrator";
  return user.role === "admin" ? "Administrator" : "User";
}
