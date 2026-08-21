import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { toJson } from '@/lib/utils';

export async function PUT(req: Request, { params }: { params: { id: string; docId: string } }) {
  const userId = await requireUserId();
  const application = await prisma.application.findFirst({ where: { id: params.id, userId } });
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const doc = await prisma.generatedDocument.findFirst({ where: { id: params.docId, applicationId: application.id } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const { content } = await req.json();
  await prisma.documentVersion.create({ data: { documentId: doc.id, content: doc.content, note: 'Manual edit checkpoint' } });
  const updated = await prisma.generatedDocument.update({ where: { id: doc.id }, data: { content: toJson(content) } });

  return NextResponse.json({ document: updated });
}
