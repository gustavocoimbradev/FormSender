"use client";

import { useState, type FormEvent } from "react";
import { ApiError, createUser, updateUser, type ManagedUser, type User, type UserInput } from "@/lib/api";
import { canChangeRole } from "@/lib/permissions";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/validation";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { MailIcon } from "../icons";
import { PasswordField } from "../PasswordField";
import { Select } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

type Role = "admin" | "user";
type Errors = { name?: string; email?: string; password?: string; form?: string };

const ROLES: { value: Role; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Administrator" },
];

type UserModalProps = {
  open: boolean;
  actor: User;
  /** Present when editing; absent when creating. */
  user?: ManagedUser;
  onClose: () => void;
  onSaved: () => void;
};

export function UserModal({ open, actor, user, onClose, onSaved }: UserModalProps) {
  return (
    <Modal open={open} title={user ? "Edit user" : "New user"} onClose={onClose}>
      {/* Remounted on each open so the form always starts from the right user. */}
      {open && <UserForm key={user?.id ?? "new"} actor={actor} user={user} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function UserForm({ actor, user, onClose, onSaved }: Omit<UserModalProps, "open">) {
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "user");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const roleLocked = user !== undefined && !canChangeRole(actor, user);

  function validate(): Errors {
    const found: Errors = {};
    if (!name.trim()) found.name = "Enter the name.";
    if (!isValidEmail(email)) found.email = "Enter a valid email.";
    if (!user && !isValidPassword(password)) found.password = "The password must be at least 8 characters.";
    if (user && password && !isValidPassword(password)) found.password = "The password must be at least 8 characters.";
    return found;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      if (user) {
        const changes: UserInput = {};
        if (name.trim() !== user.name) changes.name = name.trim();
        if (normalizeEmail(email) !== user.email) changes.email = normalizeEmail(email);
        if (password) changes.password = password;
        if (!roleLocked && role !== user.role) changes.role = role;

        await updateUser(user.id, changes);
        toast("User updated.");
      } else {
        await createUser({ name: name.trim(), email: normalizeEmail(email), password, role });
        toast("User created.");
      }

      onSaved();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        setErrors({
          name: error.fieldErrors.name ? "Enter the name." : undefined,
          email: error.fieldErrors.email ? "Enter a valid email that is not already in use." : undefined,
          password: error.fieldErrors.password ? "The password must be at least 8 characters." : undefined,
        });
      } else if (error instanceof ApiError && error.status === 403) {
        setErrors({ form: "You do not have permission to make this change." });
      } else {
        setErrors({ form: "Could not save. Please try again." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <Field id="user-name" label="Name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} disabled={saving} autoComplete="off" placeholder="Maria Souza" />
      <Field
        id="user-email"
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
        disabled={saving}
        icon={<MailIcon />}
        autoComplete="off"
        inputMode="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="maria@company.com"
      />
      <PasswordField
        id="user-password"
        label={user ? "New password" : "Password"}
        value={password}
        onChange={setPassword}
        error={errors.password}
        disabled={saving}
        placeholder={user ? "Leave blank to keep it" : "At least 8 characters"}
      />

      <div className="mb-4">
        <Select id="user-role" label="Role" value={role} options={ROLES} onChange={setRole} disabled={saving || roleLocked} />
      </div>

      {errors.form && <p role="alert" className="mb-4 rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-base text-danger">{errors.form}</p>}

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <ActionButton type="button" variant="ghost" onClick={onClose} disabled={saving} className="h-14">
          Cancel
        </ActionButton>
        <ActionButton type="submit" loading={saving} className="h-14">
          {user ? "Save" : "Create user"}
        </ActionButton>
      </div>
    </form>
  );
}
