import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const userId = await requireUserId();
  const applications = await prisma.application.findMany({
    where: { userId },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ applications });
}
