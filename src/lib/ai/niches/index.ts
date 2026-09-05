import { techAiFintech, NicheDictionary } from './techAiFintech';
import { marketing } from './marketing';
import { healthcare } from './healthcare';

// Stub niches: extension points for future work. Each has a minimal dictionary
// so the app doesn't break if detected, but only tech-ai-fintech is fully
// seeded for this pass. To flesh one out, follow the shape in techAiFintech.ts.
function stubNiche(id: string, label: string, skills: string[]): NicheDictionary {
  return {
    id,
    label,
    skills: Object.fromEntries(skills.map((s) => [s, [s.toLowerCase()]])),
    domainTerms: [],
    softSkills: ['communication', 'collaboration', 'problem-solving', 'teamwork'],
    toneDefault: 'professional',
    seniorityMarkers: {
      junior: ['junior', 'entry-level'],
      senior: ['senior', 'lead'],
    },
    companySignalMarkers: ['fast-paced', 'team-oriented'],
  };
}

export const NICHES: Record<string, NicheDictionary> = {
  'tech-ai-fintech': techAiFintech,
  marketing,
  healthcare,
  nursing: stubNiche('nursing', 'Nursing / Healthcare', ['Patient Care', 'EHR', 'HIPAA', 'Clinical Documentation', 'Triage']),
  sales: stubNiche('sales', 'Sales', ['CRM', 'Pipeline Management', 'Salesforce', 'Negotiation', 'Quota Attainment']),
  finance: stubNiche('finance', 'Finance', ['Financial Modeling', 'Excel', 'GAAP', 'Forecasting', 'Budgeting']),
  consulting: stubNiche('consulting', 'Consulting', ['Stakeholder Management', 'Process Improvement', 'PowerPoint', 'Strategy', 'Client Management']),
  trades: stubNiche('trades', 'Trades', ['OSHA', 'Blueprint Reading', 'Equipment Maintenance', 'Safety Compliance']),
  education: stubNiche('education', 'Education', ['Curriculum Development', 'Classroom Management', 'Lesson Planning', 'Student Assessment']),
};

export function getNiche(id: string): NicheDictionary {
  return NICHES[id] || NICHES['tech-ai-fintech'];
}

export function allSkillTerms(): { canonical: string; synonyms: string[]; niche: string }[] {
  const out: { canonical: string; synonyms: string[]; niche: string }[] = [];
  for (const niche of Object.values(NICHES)) {
    for (const [canonical, synonyms] of Object.entries(niche.skills)) {
      out.push({ canonical, synonyms, niche: niche.id });
    }
  }
  return out;
}

export function detectNiche(text: string): string {
  const lower = text.toLowerCase();
  let bestId = 'tech-ai-fintech';
  let bestScore = 0;
  for (const niche of Object.values(NICHES)) {
    let score = 0;
    for (const synonyms of Object.values(niche.skills)) {
      for (const syn of synonyms) {
        if (lower.includes(syn.toLowerCase())) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = niche.id;
    }
  }
  return bestId;
}
