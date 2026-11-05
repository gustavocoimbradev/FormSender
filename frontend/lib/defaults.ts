import type { Security } from "./validation";

/**
 * The email server a fresh install starts with: the local Mailpit, which only
 * catches messages. Mirrors backend/database/seeders/SmtpSettingsSeeder.php.
 */
export const DEFAULT_SMTP = {
  host: "mailpit",
  port: "1025",
  security: "none" as Security,
  username: "",
  password: "",
  fromAddress: "no-reply@formsender.test",
  fromName: "FormSender",
};
