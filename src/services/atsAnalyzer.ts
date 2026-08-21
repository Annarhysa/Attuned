import { ATSAnalysis, DesignTemplate, JobAnalysis, MatchAnalysis, TailoredResumeDraft } from '@/types';
import { containsTerm } from '@/lib/ai/textUtils';

const STANDARD_SECTIONS = ['summary', 'experience', 'education', 'skills'];

/**
 * Scores a tailored resume for ATS-friendliness. Recommendations only ever
 * surface keywords that already have supporting evidence in the match
 * analysis -- this never suggests adding something the candidate doesn't have.
 */
export function analyzeATS(draft: TailoredResumeDraft, job: JobAnalysis, match: MatchAnalysis, design?: DesignTemplate | null): ATSAnalysis {
  const resumeText = [
    draft.summary.after,
    draft.skills.after.join(' '),
    ...draft.experiences.flatMap((e) => e.afterBullets),
    ...draft.projects.flatMap((p) => p.afterBullets),
  ].join('\n');

  const keywordsFound = job.keywords.filter((k) => containsTerm(resumeText, k));
  const keywordsMissing = job.keywords.filter((k) => !keywordsFound.includes(k));
  const keywordCoverage = job.keywords.length ? Math.round((keywordsFound.length / job.keywords.length) * 100) : 100;

  const skillsMatch = match.skills_score;

  const issues: string[] = [];
  if (design && !design.atsSafe) issues.push('Selected design template is not marked ATS-safe.');
  if (design && design.layout === 'two-column') issues.push('Two-column layouts can confuse ATS parsers -- consider a single-column layout.');
  if (!draft.summary.after) issues.push('Missing a professional summary section.');
  if (draft.skills.after.length === 0) issues.push('Skills section is empty.');
  if (draft.experiences.length === 0) issues.push('No work experience listed.');

  const formattingSafe = issues.length === 0 || (design ? design.atsSafe : true);

  // Only recommend adding keywords that have real evidence (strong or partial) in the match analysis.
  const recommendedAdditions = match.evidence
    .filter((e) => e.status !== 'missing' && !containsTerm(resumeText, e.requirement))
    .map((e) => ({
      keyword: e.requirement,
      reason: `Found in your ${e.source || 'profile'} but not yet reflected in the generated resume text -- consider adding it to Technical Skills.`,
    }))
    .slice(0, 8);

  const score = Math.round(keywordCoverage * 0.45 + skillsMatch * 0.35 + (formattingSafe ? 20 : 0));

  return {
    score: Math.min(100, score),
    keywordCoverage,
    skillsMatch,
    formattingSafe,
    keywordsFound,
    keywordsMissing,
    issues,
    recommendedAdditions,
  };
}
