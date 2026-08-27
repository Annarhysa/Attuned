import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { issuePasswordResetToken } from '@/services/verification';

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return ok -- don't reveal whether an account exists for this email.
  if (!user) return NextResponse.json({ ok: true });

  const { devPreview } = await issuePasswordResetToken(user.id, user.email);
  return NextResponse.json({ ok: true, devPreview });
}
