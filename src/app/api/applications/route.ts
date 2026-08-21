import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const userId = await requireUserId();
  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });

  const application = await prisma.application.create({
    data: { userId, jobId, status: 'saved' },
  });

  return NextResponse.json({ id: application.id });
}
