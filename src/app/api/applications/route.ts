import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { canCreateApplication } from '@/lib/billing';

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!(await canCreateApplication(userId))) {
    return NextResponse.json(
      { error: 'FREE_LIMIT_REACHED', message: 'Your free trial includes 1 application. Upgrade to create more.' },
      { status: 402 }
    );
  }
  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });

  const application = await prisma.application.create({
    data: { userId, jobId, status: 'saved' },
  });

  return NextResponse.json({ id: application.id });
}
