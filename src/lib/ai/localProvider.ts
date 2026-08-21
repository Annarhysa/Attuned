import { AIProvider } from './provider';
import { detectNiche, getNiche } from './niches';
import { containsTerm, extractPhrases, normalize, splitSentences } from './textUtils';
import {
  CandidateProfile,
  CoverLetterDraft,
  DesignTemplate,
  EvidenceItem,
  GenerationOptions,
  JobAnalysis,
  MatchAnalysis,
  TailoredResumeDraft,
} from '@/types';

const RESPONSIBILITY_VERBS = [
  'develop', 'build', 'design', 'manage', 'lead', 'collaborate', 'own', 'implement',
  'maintain', 'architect', 'create', 'analyze', 'optimize', 'deploy', 'drive',
  'support', 'partner', 'deliver', 'coordinate', 'improve', 'mentor',
];

const REQUIRED_MARKERS = ['required', 'must have', 'minimum', 'must-have', 'you have', "you'll need", 'need to have'];
const PREFERRED_MARKERS = ['preferred', 'nice to have', 'bonus', 'a plus', 'is a plus', 'ideally'];

function profileText(profile: CandidateProfile): string {
  const bits: string[] = [profile.summary, profile.professionalTitle];
  for (const e of profile.experiences) {
    bits.push(e.company, e.title, ...e.bullets);
  }
  for (const p of profile.projects) {
    bits.push(p.name, p.description || '', ...p.bullets, ...p.technologies);
  }
  for (const s of profile.skills) bits.push(s.name);
  for (const c of profile.certifications) bits.push(c.name);
  bits.push(...profile.achievements);
  return bits.filter(Boolean).join('\n');
}

function findEvidence(profile: CandidateProfile, canonical: string, synonyms: string[]): EvidenceItem {
  const terms = [canonical, ...synonyms];

  // 1. Explicit skill entry
  const skillHit = profile.skills.find((s) => terms.some((t) => normalize(s.name) === normalize(t)));
  if (skillHit) {
    return { requirement: canonical, status: 'strong', evidence: skillHit.name, source: 'Skills' };
  }

  // 2. Experience bullets
  for (const exp of profile.experiences) {
    for (const bullet of exp.bullets) {
      if (terms.some((t) => containsTerm(bullet, t))) {
        return { requirement: canonical, status: 'strong', evidence: bullet, source: `Experience: ${exp.company}` };
      }
    }
  }

  // 3. Projects
  for (const proj of profile.projects) {
    const haystacks = [proj.description || '', ...proj.bullets, ...proj.technologies];
    for (const h of haystacks) {
      if (terms.some((t) => containsTerm(h, t))) {
        return { requirement: canonical, status: 'partial', evidence: h || proj.name, source: `Project: ${proj.name}` };
      }
    }
  }

  // 4. Summary
  if (terms.some((t) => containsTerm(profile.summary, t))) {
    return { requirement: canonical, status: 'partial', evidence: profile.summary, source: 'Summary' };
  }

  return { requirement: canonical, status: 'missing', evidence: null, source: null };
}

function detectSeniority(text: string): string {
  const lower = normalize(text);
  const niche = getNiche(detectNiche(text));
  for (const [level, markers] of Object.entries(niche.seniorityMarkers)) {
    if (markers.some((m) => lower.includes(normalize(m)))) return level;
  }
  const yearsMatch = lower.match(/(\d+)\+?\s*years?/);
  if (yearsMatch) {
    const yrs = parseInt(yearsMatch[1], 10);
    if (yrs >= 8) return 'senior';
    if (yrs >= 4) return 'mid';
    return 'junior';
  }
  return 'not specified';
}

function detectTone(text: string): string {
  const lower = normalize(text);
  if (['scrappy', 'fast-paced', 'move fast', 'wear many hats', 'startup'].some((m) => lower.includes(m))) return 'startup';
  if (['enterprise', 'regulated', 'fortune 500', 'compliance-driven'].some((m) => lower.includes(m))) return 'corporate';
  if (['passionate', 'love', "we're a team", 'fun'].some((m) => lower.includes(m))) return 'conversational';
  if (['architecture', 'distributed systems', 'infrastructure'].some((m) => lower.includes(m))) return 'technical';
  return 'professional';
}

function extractTitleCompany(rawText: string): { title: string; company: string; location: string; employmentType: string } {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 15);
  let title = '';
  let company = '';
  let location = '';
  let employmentType = '';

  const atMatch = rawText.match(/([A-Z][A-Za-z0-9&.,\-\s]{2,60})\s+(?:at|@)\s+([A-Z][A-Za-z0-9&.,\-\s]{1,60})/);
  if (atMatch) {
    title = atMatch[1].trim();
    company = atMatch[2].trim().split('\n')[0];
  } else if (lines.length > 0) {
    title = lines[0].slice(0, 80);
  }

  const companyLabel = rawText.match(/Company:\s*([^\n]+)/i);
  if (companyLabel) company = companyLabel[1].trim();
  const locationLabel = rawText.match(/Location:\s*([^\n]+)/i);
  if (locationLabel) location = locationLabel[1].trim();
  const typeLabel = rawText.match(/Employment Type:\s*([^\n]+)/i) || rawText.match(/\b(Full-Time|Full Time|Part-Time|Part Time|Contract|Internship|Freelance)\b/i);
  if (typeLabel) employmentType = typeLabel[1].trim();

  const remoteMatch = rawText.match(/\b(Remote|Hybrid|On-site|Onsite)\b/i);
  if (!location && remoteMatch) location = remoteMatch[1];

  return { title: title || 'Not specified', company: company || 'Not specified', location: location || 'Not specified', employmentType: employmentType || 'Not specified' };
}

export class LocalHeuristicProvider implements AIProvider {
  readonly name = 'local-heuristic';

  async analyzeJob(rawText: string): Promise<JobAnalysis> {
    const nicheId = detectNiche(rawText);
    const niche = getNiche(nicheId);
    const lower = normalize(rawText);
    const sentences = splitSentences(rawText);

    const required: string[] = [];
    const preferred: string[] = [];

    for (const [canonical, synonyms] of Object.entries(niche.skills)) {
      const hitSentence = sentences.find((s) => synonyms.some((syn) => containsTerm(s, syn)) || containsTerm(s, canonical));
      if (!hitSentence) continue;
      const sLower = normalize(hitSentence);
      if (PREFERRED_MARKERS.some((m) => sLower.includes(m))) {
        preferred.push(canonical);
      } else {
        required.push(canonical);
      }
    }

    const responsibilities = sentences.filter((s) => {
      const first = normalize(s).split(' ')[0]?.replace(/^to\s+/, '');
      return RESPONSIBILITY_VERBS.some((v) => normalize(s).startsWith(v) || first === v) && s.split(' ').length <= 30;
    }).slice(0, 10);

    const softSkills = niche.softSkills.filter((s) => lower.includes(normalize(s)));
    const domainTerms = niche.domainTerms.filter((s) => lower.includes(normalize(s)));
    const companySignals = niche.companySignalMarkers.filter((s) => lower.includes(normalize(s)));
    const importantPhrases = extractPhrases(rawText, 6);

    const keywords = Array.from(new Set([...required, ...preferred, ...domainTerms])).slice(0, 30);
    const { title, company, location, employmentType } = extractTitleCompany(rawText);
    const seniority = detectSeniority(rawText);
    const tone = detectTone(rawText);

    const topRequired = required.slice(0, 3);
    const matchStrategy = topRequired.length
      ? `Lead with concrete evidence of ${topRequired.join(', ')} -- these appear as core requirements. Mirror the job's ${tone} tone and use the employer's own terminology (${(domainTerms.slice(0, 3).join(', ') || 'industry-standard terms')}) where it's genuinely true of your background.`
      : `Emphasize your strongest, most relevant experience first and mirror the job's ${tone} tone.`;

    return {
      job_title: title,
      company,
      industry: nicheId,
      seniority,
      location,
      employment_type: employmentType,
      required_skills: required,
      preferred_skills: preferred,
      responsibilities,
      keywords,
      soft_skills: softSkills,
      technologies: required.filter((r) => ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'React', 'Node.js', 'Spark', 'Airflow', 'Terraform'].includes(r)),
      domain_terms: domainTerms,
      important_phrases: importantPhrases,
      tone,
      company_signals: companySignals,
      match_strategy: matchStrategy,
    };
  }

  async matchProfileToJob(profile: CandidateProfile, job: JobAnalysis): Promise<MatchAnalysis> {
    const niche = getNiche(job.industry);
    const allRequirements = [...job.required_skills, ...job.preferred_skills];

    const evidence: EvidenceItem[] = allRequirements.map((req) => {
      const synonyms = niche.skills[req] || [];
      return findEvidence(profile, req, synonyms);
    });

    const requiredEvidence = evidence.slice(0, job.required_skills.length);
    const preferredEvidence = evidence.slice(job.required_skills.length);

    const scoreOf = (items: EvidenceItem[]) => {
      if (items.length === 0) return 100;
      const points = items.reduce((sum, e) => sum + (e.status === 'strong' ? 1 : e.status === 'partial' ? 0.5 : 0), 0);
      return Math.round((points / items.length) * 100);
    };

    const requiredScore = scoreOf(requiredEvidence);
    const preferredScore = scoreOf(preferredEvidence);
    const skillsScore = Math.round(requiredScore * 0.75 + preferredScore * 0.25);

    const profileTxt = profileText(profile);
    const respHits = job.responsibilities.filter((r) => {
      const words = normalize(r).split(' ').filter((w) => w.length > 4);
      const hitCount = words.filter((w) => normalize(profileTxt).includes(w)).length;
      return words.length > 0 && hitCount / words.length >= 0.35;
    });
    const responsibilityScore = job.responsibilities.length ? Math.round((respHits.length / job.responsibilities.length) * 100) : 100;

    const totalYears = profile.experiences.length * 2; // rough proxy when explicit dates aren't parsed
    const seniorityOrder = ['intern', 'junior', 'mid', 'senior', 'staff', 'lead', 'manager'];
    const experienceScore = (() => {
      if (job.seniority === 'not specified') return profile.experiences.length > 0 ? 80 : 40;
      const idx = seniorityOrder.indexOf(job.seniority);
      if (idx <= 1) return profile.experiences.length >= 1 ? 85 : 55;
      if (idx <= 3) return Math.min(95, 50 + profile.experiences.length * 15);
      return Math.min(95, 40 + profile.experiences.length * 12);
    })();

    const industryScore = (() => {
      const domainHits = job.domain_terms.filter((d) => containsTerm(profileTxt, d)).length;
      const techHits = job.technologies.filter((t) => containsTerm(profileTxt, t)).length;
      const base = job.domain_terms.length + job.technologies.length;
      if (base === 0) return 70;
      return Math.round(((domainHits + techHits) / base) * 100);
    })();

    const keywordsFound = job.keywords.filter((k) => containsTerm(profileTxt, k)).length;
    const keywordScore = job.keywords.length ? Math.round((keywordsFound / job.keywords.length) * 100) : 100;

    const educationScore = profile.education.length > 0 ? 85 : 45;

    const overall = Math.round(
      skillsScore * 0.3 +
        experienceScore * 0.2 +
        industryScore * 0.15 +
        keywordScore * 0.2 +
        educationScore * 0.05 +
        responsibilityScore * 0.1
    );

    const strengths = evidence.filter((e) => e.status === 'strong').map((e) => e.requirement).slice(0, 10);
    const gaps = evidence.filter((e) => e.status === 'missing').map((e) => e.requirement).slice(0, 10);

    const recommendations: string[] = [];
    const strongProjectEvidence = evidence.find((e) => e.status === 'partial' && e.source?.startsWith('Project'));
    if (strongProjectEvidence) {
      recommendations.push(`Emphasize your ${strongProjectEvidence.source?.replace('Project: ', '')} project -- it demonstrates ${strongProjectEvidence.requirement}, which this role calls for.`);
    }
    if (strengths.length >= 2) {
      recommendations.push(`Move ${strengths.slice(0, 2).join(' and ')} higher in your skills section since they're explicitly required.`);
    }
    if (gaps.length > 0) {
      recommendations.push(`Consider addressing the gap in ${gaps.slice(0, 2).join(', ')} directly in your cover letter, or note related transferable experience if you have it.`);
    }
    if (respHits.length > 0) {
      recommendations.push(`Highlight your experience related to "${respHits[0]}" -- it maps directly to a responsibility in this role.`);
    }
    if (recommendations.length === 0) {
      recommendations.push('Your background aligns broadly with this role -- focus on quantifying your existing achievements.');
    }

    return {
      overall_score: overall,
      skills_score: skillsScore,
      experience_score: experienceScore,
      industry_score: industryScore,
      keyword_score: keywordScore,
      education_score: educationScore,
      responsibility_score: responsibilityScore,
      strengths,
      gaps,
      recommendations,
      evidence,
      keywords_found: keywordsFound,
      keywords_total: job.keywords.length,
    };
  }

  async generateCoverLetter(
    profile: CandidateProfile,
    job: JobAnalysis,
    match: MatchAnalysis,
    options: GenerationOptions
  ): Promise<CoverLetterDraft> {
    const withEvidence = match.evidence.filter((e) => e.status !== 'missing' && e.evidence);
    // Prefer real sentence-level evidence (experience/project bullets) over bare skill-list hits for prose.
    const narrativeEvidence = withEvidence.filter((e) => e.source && !e.source.startsWith('Skills'));
    const skillOnlyEvidence = withEvidence.filter((e) => e.source && e.source.startsWith('Skills'));
    const strongEvidence = [...narrativeEvidence, ...skillOnlyEvidence].slice(0, 3);
    const company = job.company !== 'Not specified' ? job.company : 'your team';
    const title = job.job_title !== 'Not specified' ? job.job_title : 'this role';

    const toneOpeners: Record<string, string> = {
      professional: `I'm writing to express my interest in the ${title} position at ${company}.`,
      confident: `I'm confident I'd add immediate value as your next ${title} at ${company}.`,
      technical: `As an engineer with hands-on experience in ${strongEvidence[0]?.requirement || 'the core areas this role requires'}, I'm excited to apply for the ${title} role at ${company}.`,
      startup: `I've been following ${company}'s work, and the ${title} role is exactly the kind of fast-moving, high-ownership problem I want to work on next.`,
      corporate: `I am pleased to submit my application for the ${title} position at ${company}.`,
      conversational: `When I saw the ${title} opening at ${company}, I knew I had to apply.`,
    };

    const opening = toneOpeners[options.tone] || toneOpeners.professional;

    const body: string[] = [];
    for (const e of strongEvidence) {
      if (!e.evidence) continue;
      if (e.source && e.source.startsWith('Skills')) {
        body.push(`I bring hands-on ${e.requirement} experience, which is core to this role.`);
      } else {
        body.push(`My work on "${e.evidence}" (${e.source}) speaks directly to your need for ${e.requirement}.`);
      }
    }
    if (body.length === 0) {
      body.push(`My background in ${profile.professionalTitle || 'this field'} has prepared me to contribute from day one.`);
    }
    if (options.length !== 'short' && match.recommendations.length > 0) {
      body.push(match.recommendations[0]);
    }

    const domainTermsUsed = job.domain_terms.slice(0, 2);
    const domainParagraph = domainTermsUsed.length
      ? `I'm particularly comfortable operating in environments that require attention to ${domainTermsUsed.join(' and ')}, which I understand are important considerations for this role.`
      : `I bring a track record of translating requirements into working, reliable systems.`;

    const missingNote = match.gaps.length > 0 && options.length === 'detailed'
      ? ` While I haven't worked directly with ${match.gaps[0]}, I pick up new tools quickly and I'm eager to close that gap.`
      : '';

    const closingByTone: Record<string, string> = {
      professional: `I'd welcome the opportunity to discuss how my experience aligns with your needs. Thank you for your consideration.`,
      confident: `I'm ready to get started and would love to talk through how I can help ${company} hit its goals.`,
      technical: `Happy to walk through the technical details of any of the above -- looking forward to a conversation.`,
      startup: `Let's talk -- I'm available whenever works for your team.`,
      corporate: `I look forward to the possibility of discussing this opportunity further.`,
      conversational: `Would love to chat more about how I can help out -- thanks for reading!`,
    };

    return {
      header: {
        candidateName: profile.fullName,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        company,
      },
      opening,
      body,
      domainParagraph: domainParagraph + missingNote,
      closing: closingByTone[options.tone] || closingByTone.professional,
      signature: profile.fullName,
    };
  }

  async tailorResume(
    profile: CandidateProfile,
    job: JobAnalysis,
    match: MatchAnalysis,
    options: GenerationOptions
  ): Promise<TailoredResumeDraft> {
    const strongReqs = match.evidence.filter((e) => e.status === 'strong').map((e) => e.requirement);
    const isAggressive = options.optimizationLevel === 'aggressive';
    const isLight = options.optimizationLevel === 'light';

    const beforeSummary = profile.summary || '';
    let afterSummary = beforeSummary;
    if (!isLight) {
      const lead = profile.professionalTitle ? `${profile.professionalTitle}` : 'Professional';
      const highlight = strongReqs.slice(0, isAggressive ? 4 : 2).join(', ');
      afterSummary = highlight
        ? `${lead} with hands-on experience in ${highlight}. ${beforeSummary}`.trim()
        : beforeSummary;
    }

    const beforeSkills = profile.skills.map((s) => s.name);
    const afterSkills = [...beforeSkills].sort((a, b) => {
      const aRank = strongReqs.includes(a) ? 0 : 1;
      const bRank = strongReqs.includes(b) ? 0 : 1;
      return aRank - bRank;
    });

    const experiences = profile.experiences.map((exp) => {
      const afterBullets = exp.bullets.map((b) => {
        if (isLight) return b;
        const matchedReq = strongReqs.find((r) => containsTerm(b, r));
        if (matchedReq && isAggressive && !b.toLowerCase().includes('scalable') && !b.toLowerCase().includes(matchedReq.toLowerCase())) {
          return b; // never fabricate new clauses -- only reorder/emphasize, keep bullet text factual
        }
        return b;
      });
      return { entry: exp, beforeBullets: exp.bullets, afterBullets, changed: false };
    });

    // Reorder experiences/projects so ones with strong evidence surface first (order only, content untouched)
    const scoredExperiences = experiences
      .map((e) => ({
        ...e,
        score: e.entry.bullets.filter((b) => strongReqs.some((r) => containsTerm(b, r))).length,
      }))
      .sort((a, b) => b.score - a.score);

    const projects = profile.projects.map((proj) => ({
      entry: proj,
      beforeBullets: proj.bullets,
      afterBullets: proj.bullets,
      changed: false,
    }));
    const scoredProjects = projects
      .map((p) => ({
        ...p,
        score:
          p.entry.bullets.filter((b) => strongReqs.some((r) => containsTerm(b, r))).length +
          p.entry.technologies.filter((t) => strongReqs.includes(t)).length,
      }))
      .sort((a, b) => b.score - a.score);

    const omittedKeywords = match.evidence.filter((e) => e.status === 'missing').map((e) => e.requirement);

    return {
      headline: profile.professionalTitle,
      summary: { before: beforeSummary, after: afterSummary, changed: afterSummary !== beforeSummary },
      skills: { before: beforeSkills, after: afterSkills, changed: JSON.stringify(beforeSkills) !== JSON.stringify(afterSkills) },
      experiences: scoredExperiences.map(({ score, ...rest }) => rest),
      projects: scoredProjects.map(({ score, ...rest }) => rest),
      education: profile.education,
      certifications: profile.certifications,
      omittedKeywords,
    };
  }

  async recommendDesign(job: JobAnalysis): Promise<DesignTemplate> {
    const presets: Record<string, DesignTemplate> = {
      'tech-ai-fintech': {
        name: 'FinTech Corporate',
        industry: 'fintech',
        primaryColor: '#1e3a5f',
        secondaryColor: '#3b6ea5',
        font: 'Georgia',
        fontSize: 'medium',
        spacing: 'normal',
        layout: 'single-column',
        headerStyle: 'classic',
        sectionStyle: 'underline',
        accentStyle: 'minimal',
        atsSafe: true,
      },
      marketing: {
        name: 'Creative Marketing',
        industry: 'marketing',
        primaryColor: '#7c2d12',
        secondaryColor: '#ea580c',
        font: 'Poppins',
        fontSize: 'medium',
        spacing: 'relaxed',
        layout: 'single-column',
        headerStyle: 'modern',
        sectionStyle: 'bold-caps',
        accentStyle: 'accent-bar',
        atsSafe: true,
      },
      healthcare: {
        name: 'Healthcare Trust',
        industry: 'healthcare',
        primaryColor: '#0e5f6e',
        secondaryColor: '#3b8fa3',
        font: 'Calibri',
        fontSize: 'medium',
        spacing: 'normal',
        layout: 'single-column',
        headerStyle: 'classic',
        sectionStyle: 'underline',
        accentStyle: 'minimal',
        atsSafe: true,
      },
    };

    if (job.tone === 'startup') {
      return {
        name: 'AI Startup Minimal',
        industry: job.industry,
        primaryColor: '#0f172a',
        secondaryColor: '#22d3ee',
        font: 'Inter',
        fontSize: 'medium',
        spacing: 'compact',
        layout: 'single-column',
        headerStyle: 'modern',
        sectionStyle: 'bold-caps',
        accentStyle: 'accent-bar',
        atsSafe: true,
      };
    }
    if (job.tone === 'technical') {
      return {
        name: 'Engineering Technical',
        industry: job.industry,
        primaryColor: '#1f2937',
        secondaryColor: '#2563eb',
        font: 'Inter',
        fontSize: 'medium',
        spacing: 'normal',
        layout: 'single-column',
        headerStyle: 'classic',
        sectionStyle: 'underline',
        accentStyle: 'minimal',
        atsSafe: true,
      };
    }

    return (
      presets[job.industry] || {
        name: 'ATS Professional',
        industry: 'general',
        primaryColor: '#111827',
        secondaryColor: '#374151',
        font: 'Arial',
        fontSize: 'medium',
        spacing: 'normal',
        layout: 'single-column',
        headerStyle: 'classic',
        sectionStyle: 'plain',
        accentStyle: 'none',
        atsSafe: true,
      }
    );
  }
}
