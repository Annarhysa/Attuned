import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { consumePasswordResetToken } from '@/services/verification';

export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'A valid token and an 8+ character password are required.' }, { status: 400 });
  }

  const userId = await consumePasswordResetToken(token);
  if (!userId) return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
