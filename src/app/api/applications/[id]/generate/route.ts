import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from '@/lib/ai';
import { toDomainProfile } from '@/lib/profileMapper';
import { toDomainJobAnalysis } from '@/lib/jobMapper';
import { toJson, safeJsonParse } from '@/lib/utils';
import { CandidateProfile, GenerationOptions, MatchAnalysis } from '@/types';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const body = await req.json();
  const options: GenerationOptions = body.options || { tone: 'professional', length: 'medium', language: 'English', optimizationLevel: 'balanced' };
  const generate: { resume: boolean; coverLetter: boolean } = body.generate || { resume: true, coverLetter: true };

  const application = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { job: { include: { analysis: true } } },
  });
  if (!application || !application.job.analysis) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const profileRow = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, education: true, projects: true, skills: true, certifications: true, achievements: true },
  });
  if (!profileRow) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 400 });

  const jobAnalysis = toDomainJobAnalysis(application.job, application.job.analysis);
  const domainProfile = toDomainProfile(profileRow);
  const match = safeJsonParse<MatchAnalysis | null>(application.matchAnalysis, null);
  if (!match) return NextResponse.json({ error: 'Run match analysis before generating documents.' }, { status: 400 });

  const provider = getAIProvider();

  // Preserve the original resume snapshot once, untouched.
  const existingOriginal = await prisma.generatedDocument.findFirst({ where: { applicationId: application.id, type: 'resume_original' } });
  if (!existingOriginal) {
    await prisma.generatedDocument.create({
      data: { applicationId: application.id, type: 'resume_original', content: toJson(domainProfile) },
    });
  }

  let tailoredMatch: MatchAnalysis | undefined;

  if (generate.resume) {
    const draft = await provider.tailorResume(domainProfile, jobAnalysis, match, options);
    const existing = await prisma.generatedDocument.findFirst({ where: { applicationId: application.id, type: 'resume_tailored' } });
    if (existing) {
      await prisma.documentVersion.create({ data: { documentId: existing.id, content: existing.content, note: 'Auto-saved before regeneration' } });
      await prisma.generatedDocument.update({ where: { id: existing.id }, data: { content: toJson(draft) } });
    } else {
      await prisma.generatedDocument.create({ data: { applicationId: application.id, type: 'resume_tailored', content: toJson(draft) } });
    }

    // Recompute match against the tailored, wording-improved profile (same facts, better JD-aligned phrasing).
    const tailoredProfile: CandidateProfile = {
      ...domainProfile,
      summary: draft.summary.after,
      skills: draft.skills.after.map((name) => ({ name, category: 'technical' })),
      experiences: draft.experiences.map((e) => ({ ...e.entry, bullets: e.afterBullets })),
      projects: draft.projects.map((p) => ({ ...p.entry, bullets: p.afterBullets })),
    };
    tailoredMatch = await provider.matchProfileToJob(tailoredProfile, jobAnalysis);
    await prisma.application.update({ where: { id: application.id }, data: { tailoredMatchAnalysis: toJson(tailoredMatch) } });
  }

  if (generate.coverLetter) {
    const letter = await provider.generateCoverLetter(domainProfile, jobAnalysis, match, options);
    const existing = await prisma.generatedDocument.findFirst({ where: { applicationId: application.id, type: 'cover_letter' } });
    if (existing) {
      await prisma.documentVersion.create({ data: { documentId: existing.id, content: existing.content, note: 'Auto-saved before regeneration' } });
      await prisma.generatedDocument.update({ where: { id: existing.id }, data: { content: toJson(letter) } });
    } else {
      await prisma.generatedDocument.create({ data: { applicationId: application.id, type: 'cover_letter', content: toJson(letter) } });
    }
  }

  const documents = await prisma.generatedDocument.findMany({ where: { applicationId: application.id } });
  return NextResponse.json({ documents, tailoredMatch });
}
