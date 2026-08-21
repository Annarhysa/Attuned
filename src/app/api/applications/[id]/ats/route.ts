import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';
import { toDomainJobAnalysis } from '@/lib/jobMapper';
import { analyzeATS } from '@/services/atsAnalyzer';
import { DesignTemplate, MatchAnalysis, TailoredResumeDraft } from '@/types';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const application = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { job: { include: { analysis: true } }, documents: true, designTemplate: true },
  });
  if (!application || !application.job.analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const resumeDoc = application.documents.find((d) => d.type === 'resume_tailored');
  const match = safeJsonParse<MatchAnalysis | null>(application.tailoredMatchAnalysis || application.matchAnalysis, null);
  if (!resumeDoc || !match) return NextResponse.json({ error: 'Generate a tailored resume before running the ATS check.' }, { status: 400 });

  const draft = safeJsonParse<TailoredResumeDraft | null>(resumeDoc.content, null);
  if (!draft) return NextResponse.json({ error: 'Tailored resume content is invalid.' }, { status: 400 });
  const jobAnalysis = toDomainJobAnalysis(application.job, application.job.analysis);
  const design: DesignTemplate | null = application.designTemplate as unknown as DesignTemplate | null;

  const ats = analyzeATS(draft, jobAnalysis, match, design);
  return NextResponse.json({ ats });
}
