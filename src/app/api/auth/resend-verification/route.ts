import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issueEmailVerificationLink } from '@/services/verification';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Don't reveal whether the account exists.
  if (!user || user.emailVerified) return NextResponse.json({ ok: true });

  const { devPreview } = await issueEmailVerificationLink(user.id, user.email);
  return NextResponse.json({ ok: true, devPreview });
}
