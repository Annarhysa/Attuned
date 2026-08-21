import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { toDomainProfile } from '@/lib/profileMapper';
import { toJson } from '@/lib/utils';
import { CandidateProfile } from '@/types';

export async function GET() {
  const userId = await requireUserId();
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, education: true, projects: true, skills: true, certifications: true, achievements: true },
  });
  if (!profile) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: toDomainProfile(profile) });
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  const body = (await req.json()) as CandidateProfile;

  const existing = await prisma.candidateProfile.findUnique({ where: { userId } });

  const baseData = {
    fullName: body.fullName || '',
    professionalTitle: body.professionalTitle || '',
    location: body.location || '',
    email: body.email || '',
    phone: body.phone || '',
    linkedin: body.linkedin || '',
    github: body.github || '',
    portfolio: body.portfolio || '',
    summary: body.summary || '',
    languages: toJson(body.languages || []),
    originalResumeFileId: body.originalResumeFileId ?? existing?.originalResumeFileId ?? null,
  };

  const profileId = existing
    ? (await prisma.candidateProfile.update({ where: { userId }, data: baseData })).id
    : (await prisma.candidateProfile.create({ data: { ...baseData, userId } })).id;

  // Replace child collections wholesale -- simplest correct approach for a profile-editor save.
  await prisma.$transaction([
    prisma.experience.deleteMany({ where: { profileId } }),
    prisma.education.deleteMany({ where: { profileId } }),
    prisma.project.deleteMany({ where: { profileId } }),
    prisma.skill.deleteMany({ where: { profileId } }),
    prisma.certification.deleteMany({ where: { profileId } }),
    prisma.achievement.deleteMany({ where: { profileId } }),
  ]);

  await prisma.$transaction([
    ...body.experiences.map((e, i) =>
      prisma.experience.create({
        data: { profileId, company: e.company, title: e.title, location: e.location || '', startDate: e.startDate, endDate: e.endDate, bullets: toJson(e.bullets), order: i },
      })
    ),
    ...body.education.map((e, i) =>
      prisma.education.create({
        data: { profileId, institution: e.institution, degree: e.degree, field: e.field || '', startDate: e.startDate || '', endDate: e.endDate || '', details: e.details || '', order: i },
      })
    ),
    ...body.projects.map((p, i) =>
      prisma.project.create({
        data: { profileId, name: p.name, description: p.description || '', bullets: toJson(p.bullets), technologies: toJson(p.technologies), link: p.link || '', order: i },
      })
    ),
    ...body.skills.map((s, i) => prisma.skill.create({ data: { profileId, name: s.name, category: s.category, order: i } })),
    ...body.certifications.map((c) => prisma.certification.create({ data: { profileId, name: c.name, issuer: c.issuer || '', date: c.date || '' } })),
    ...body.achievements.map((a) => prisma.achievement.create({ data: { profileId, description: a } })),
  ]);

  const full = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, education: true, projects: true, skills: true, certifications: true, achievements: true },
  });

  return NextResponse.json({ profile: toDomainProfile(full!) });
}
