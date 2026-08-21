import { Job, JobAnalysis as PrismaJobAnalysis } from '@prisma/client';
import { JobAnalysis } from '@/types';
import { safeJsonParse } from '@/lib/utils';

export function toDomainJobAnalysis(job: Job, analysis: PrismaJobAnalysis): JobAnalysis {
  return {
    job_title: job.title,
    company: job.company,
    industry: analysis.niche,
    seniority: analysis.seniority,
    location: job.location,
    employment_type: job.employmentType,
    required_skills: safeJsonParse(analysis.requiredSkills, []),
    preferred_skills: safeJsonParse(analysis.preferredSkills, []),
    responsibilities: safeJsonParse(analysis.responsibilities, []),
    keywords: safeJsonParse(analysis.keywords, []),
    soft_skills: safeJsonParse(analysis.softSkills, []),
    technologies: safeJsonParse(analysis.technologies, []),
    domain_terms: safeJsonParse(analysis.domainTerms, []),
    important_phrases: safeJsonParse(analysis.importantPhrases, []),
    tone: analysis.tone,
    company_signals: safeJsonParse(analysis.companySignals, []),
    match_strategy: analysis.matchStrategy,
  };
}
