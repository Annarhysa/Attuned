import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const existing = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { documents: true },
  });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const copy = await prisma.application.create({
    data: {
      userId,
      jobId: existing.jobId,
      status: 'saved',
      notes: existing.notes,
      matchAnalysis: existing.matchAnalysis,
      tailoredMatchAnalysis: existing.tailoredMatchAnalysis,
      designTemplateId: existing.designTemplateId,
      documents: {
        create: existing.documents.map((d) => ({ type: d.type, content: d.content })),
      },
    },
  });

  return NextResponse.json({ id: copy.id });
}
