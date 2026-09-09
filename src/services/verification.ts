import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

const VERIFY_TTL_MINUTES = 24 * 60;
const RESET_TTL_MINUTES = 60;

/**
 * Link-based email verification (not OTP): a clickable confirmation link,
 * consistent with the password-reset flow below. Verification is
 * informational only -- login does not block on it, so this never gates
 * access to the app.
 */
export async function issueEmailVerificationLink(userId: string, email: string): Promise<{ devPreview?: string }> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MINUTES * 60 * 1000);
  await prisma.verificationCode.create({ data: { userId, purpose: 'verify_email', code: token, expiresAt } });
  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email/confirm?token=${token}`;
  const result = await sendMail(
    email,
    'Verify your Attuned account',
    `Click here to verify your email: ${verifyUrl} (expires in 24 hours).`
  );
  return { devPreview: result.devPreview ? verifyUrl : undefined };
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
  const record = await prisma.verificationCode.findFirst({
    where: { purpose: 'verify_email', code: token, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) return null;
  await prisma.$transaction([
    prisma.verificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
  ]);
  return record.userId;
}

export async function issuePasswordResetToken(userId: string, email: string): Promise<{ devPreview?: string }> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);
  await prisma.verificationCode.create({ data: { userId, purpose: 'reset_password', code: token, expiresAt } });
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const result = await sendMail(
    email,
    'Reset your Attuned password',
    `Reset your password here: ${resetUrl} (expires in ${RESET_TTL_MINUTES} minutes). If you didn't request this, ignore this email.`
  );
  return { devPreview: result.devPreview ? resetUrl : undefined };
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const record = await prisma.verificationCode.findFirst({
    where: { purpose: 'reset_password', code: token, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) return null;
  await prisma.verificationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
