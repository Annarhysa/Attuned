import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  const userId = await requireUserId();
  // Cascades remove profile, applications, generated documents, etc.
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}
