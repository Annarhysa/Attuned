import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { issueEmailVerificationLink } from '@/services/verification';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().trim().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid input' }, { status: 400 });
  }
  const { name, email, password, referralCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const referrer = referralCode
    ? await prisma.user.findUnique({ where: { referralCode }, select: { id: true } })
    : null;

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      referredById: referrer?.id,
      profile: { create: { fullName: name } },
    },
  });

  // A completed signup through a referral link permanently unlocks the
  // discounted EUR 30/year rate for whoever referred them.
  if (referrer) {
    await prisma.user.update({ where: { id: referrer.id }, data: { referralUnlocked: true } });
  }

  const { devPreview } = await issueEmailVerificationLink(user.id, user.email);

  return NextResponse.json({ id: user.id, email: user.email, devPreview });
}
