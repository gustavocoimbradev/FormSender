"use client";

import { useState, type FormEvent } from "react";
import { ApiError, createUser, resendUserConfirmation, updateUser, type ManagedUser, type User, type UserInput } from "@/lib/api";
import { canDeleteUser } from "@/lib/permissions";
import { isValidEmail, isValidPassword, normalizeEmail } from "@/lib/validation";
import { ActionButton } from "../Button";
import { Field } from "../Field";
import { MailIcon, TrashIcon } from "../icons";
import { PasswordField } from "../PasswordField";
import { Modal, ModalActions } from "../ui/Modal";
import { useToast } from "../ui/Toast";

type Errors = { name?: string; email?: string; password?: string; form?: string };

type UserModalProps = {
  open: boolean;
  actor: User;
  /** Present when editing; absent when creating. */
  user?: ManagedUser;
  onClose: () => void;
  onSaved: () => void;
  /** Asks to delete the user being edited (the screen shows the confirmation). */
  onDelete?: (user: ManagedUser) => void;
};

export function UserModal({ open, actor, user, onClose, onSaved, onDelete }: UserModalProps) {
  return (
    <Modal open={open} title={user ? "Edit user" : "New user"} onClose={onClose}>
      {/* Remounted on each open so the form always starts from the right user. */}
      {open && <UserForm key={user?.id ?? "new"} actor={actor} user={user} onClose={onClose} onSaved={onSaved} onDelete={onDelete} />}
    </Modal>
  );
}

function UserForm({ actor, user, onClose, onSaved, onDelete }: Omit<UserModalProps, "open">) {
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  function validate(): Errors {
    const found: Errors = {};
    if (!name.trim()) found.name = "Enter the name.";
    if (!isValidEmail(email)) found.email = "Enter a valid email.";
    if (!user && !isValidPassword(password)) found.password = "The password must be at least 8 characters.";
    if (user && password && !isValidPassword(password)) found.password = "The password must be at least 8 characters.";
    return found;
  }

  async function sendLinkAgain() {
    if (!user) return;

    setResending(true);
    try {
      await resendUserConfirmation(user.id);
      toast("A new link is on its way.");
    } catch {
      toast("Could not send it. Please try again.", "error");
    } finally {
      setResending(false);
    }
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

        await updateUser(user.id, changes);
        toast("User updated.");
      } else {
        await createUser({ name: name.trim(), email: normalizeEmail(email), password });
        toast("User created. We emailed a link to confirm the address.");
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
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col sm:block">
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

      {user && !user.email_confirmed && (
        <div className="mb-4 rounded-control border border-surface/10 p-4">
          <p className="mb-3 text-base text-muted">This email was not confirmed yet, so the account cannot sign in. The link we sent works for 48 hours.</p>
          <ActionButton type="button" variant="ghost" loading={resending} disabled={saving} onClick={() => void sendLinkAgain()}>
            Send the link again
          </ActionButton>
        </div>
      )}

      {errors.form && <p role="alert" className="mb-4 rounded-control border border-danger/30 bg-danger/10 px-4 py-3 text-base text-danger">{errors.form}</p>}

      <ModalActions className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {user && onDelete && canDeleteUser(actor, user) ? (
          <ActionButton type="button" variant="danger" onClick={() => onDelete(user)} disabled={saving} className="h-14 px-6">
            <TrashIcon /> Delete
          </ActionButton>
        ) : (
          <ActionButton type="button" variant="ghost" onClick={onClose} disabled={saving} className="h-14 px-6">
            Cancel
          </ActionButton>
        )}
        <ActionButton type="submit" loading={saving} className="h-14 sm:px-10">
          {user ? "Save" : "Create user"}
        </ActionButton>
      </ModalActions>
    </form>
  );
}
