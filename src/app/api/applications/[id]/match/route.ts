import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from '@/lib/ai';
import { toDomainProfile } from '@/lib/profileMapper';
import { toDomainJobAnalysis } from '@/lib/jobMapper';
import { toJson } from '@/lib/utils';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();

  const application = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { job: { include: { analysis: true } } },
  });
  if (!application || !application.job.analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, education: true, projects: true, skills: true, certifications: true, achievements: true },
  });
  if (!profile) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 400 });

  const jobAnalysis = toDomainJobAnalysis(application.job, application.job.analysis);
  const domainProfile = toDomainProfile(profile);

  const provider = getAIProvider();
  const match = await provider.matchProfileToJob(domainProfile, jobAnalysis);

  await prisma.application.update({ where: { id: application.id }, data: { matchAnalysis: toJson(match) } });

  return NextResponse.json({ match, job: jobAnalysis });
}
