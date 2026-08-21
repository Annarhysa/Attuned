import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const application = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { job: { include: { analysis: true } }, documents: true, designTemplate: true },
  });
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ application });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const body = await req.json();
  const existing = await prisma.application.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.followUpDate !== undefined) data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
  if (body.appliedAt !== undefined) data.appliedAt = body.appliedAt ? new Date(body.appliedAt) : null;
  if (body.designTemplateId !== undefined) data.designTemplateId = body.designTemplateId;
  if (body.matchAnalysis !== undefined) data.matchAnalysis = body.matchAnalysis;
  if (body.tailoredMatchAnalysis !== undefined) data.tailoredMatchAnalysis = body.tailoredMatchAnalysis;

  const updated = await prisma.application.update({ where: { id: params.id }, data });
  return NextResponse.json({ application: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const existing = await prisma.application.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.application.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
