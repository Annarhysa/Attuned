/**
 * Pluggable mailer, same shape as the AI provider / storage driver: a
 * "console" driver by default (no SMTP creds needed -- logs the email and,
 * in development, returns its content to the caller so OTP/reset flows are
 * fully testable without a real inbox), and an SMTP driver via nodemailer
 * when SMTP_HOST is set.
 */

interface SendResult {
  devPreview?: string; // populated by the console driver so UI can surface it locally
}

async function sendViaConsole(to: string, subject: string, body: string): Promise<SendResult> {
  // eslint-disable-next-line no-console
  console.log(`\n[mailer] To: ${to}\n[mailer] Subject: ${subject}\n[mailer] ${body}\n`);
  return { devPreview: body };
}

async function sendViaSmtp(to: string, subject: string, body: string): Promise<SendResult> {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: process.env.SMTP_FROM || 'no-reply@attuned.local', to, subject, text: body });
  return {};
}

export async function sendMail(to: string, subject: string, body: string): Promise<SendResult> {
  if (process.env.SMTP_HOST) return sendViaSmtp(to, subject, body);
  return sendViaConsole(to, subject, body);
}

export function isConsoleMailer(): boolean {
  return !process.env.SMTP_HOST;
}
