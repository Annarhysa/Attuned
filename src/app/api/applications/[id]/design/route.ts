import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from '@/lib/ai';
import { toDomainJobAnalysis } from '@/lib/jobMapper';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const application = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { job: { include: { analysis: true } } },
  });
  if (!application || !application.job.analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const jobAnalysis = toDomainJobAnalysis(application.job, application.job.analysis);
  const provider = getAIProvider();
  const recommended = await provider.recommendDesign(jobAnalysis);

  let template = await prisma.designTemplate.findFirst({ where: { name: recommended.name } });
  if (!template) {
    template = await prisma.designTemplate.create({ data: { ...recommended } });
  }

  await prisma.application.update({ where: { id: application.id }, data: { designTemplateId: template.id } });

  return NextResponse.json({ template });
}

export async function GET() {
  const templates = await prisma.designTemplate.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ templates });
}
