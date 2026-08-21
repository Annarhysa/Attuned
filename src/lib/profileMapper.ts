import { CandidateProfile as PrismaCandidateProfile, Experience, Education, Project, Skill, Certification, Achievement } from '@prisma/client';
import { CandidateProfile } from '@/types';
import { safeJsonParse } from '@/lib/utils';

type FullProfile = PrismaCandidateProfile & {
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  certifications: Certification[];
  achievements: Achievement[];
};

export function toDomainProfile(p: FullProfile): CandidateProfile {
  return {
    id: p.id,
    fullName: p.fullName,
    professionalTitle: p.professionalTitle,
    location: p.location,
    email: p.email,
    phone: p.phone,
    linkedin: p.linkedin,
    github: p.github,
    portfolio: p.portfolio,
    summary: p.summary,
    languages: safeJsonParse<string[]>(p.languages, []),
    originalResumeFileId: p.originalResumeFileId,
    experiences: p.experiences
      .sort((a, b) => a.order - b.order)
      .map((e) => ({
        id: e.id,
        company: e.company,
        title: e.title,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        bullets: safeJsonParse<string[]>(e.bullets, []),
      })),
    education: p.education
      .sort((a, b) => a.order - b.order)
      .map((e) => ({
        id: e.id,
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        startDate: e.startDate,
        endDate: e.endDate,
        details: e.details,
      })),
    projects: p.projects
      .sort((a, b) => a.order - b.order)
      .map((pr) => ({
        id: pr.id,
        name: pr.name,
        description: pr.description,
        bullets: safeJsonParse<string[]>(pr.bullets, []),
        technologies: safeJsonParse<string[]>(pr.technologies, []),
        link: pr.link,
      })),
    skills: p.skills
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ id: s.id, name: s.name, category: s.category as CandidateProfile['skills'][number]['category'] })),
    certifications: p.certifications.map((c) => ({ id: c.id, name: c.name, issuer: c.issuer, date: c.date })),
    achievements: p.achievements.map((a) => a.description),
  };
}
