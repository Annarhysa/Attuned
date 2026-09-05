// Shared domain types used across services, hooks, and components.
// These mirror the Prisma models but are the "working" shapes used in-memory
// and over the wire (JSON string fields expanded to real arrays/objects).

export interface ExperienceEntry {
  id?: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate: string; // "" or "Present"
  bullets: string[];
}

export interface EducationEntry {
  id?: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  details?: string;
}

export interface ProjectEntry {
  id?: string;
  name: string;
  description?: string;
  bullets: string[];
  technologies: string[];
  link?: string;
}

export interface SkillEntry {
  id?: string;
  name: string;
  category: 'technical' | 'soft' | 'tool' | 'domain';
}

export interface CertificationEntry {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
}

export interface CandidateProfile {
  id?: string;
  fullName: string;
  professionalTitle: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  portfolio: string;
  summary: string;
  languages: string[];
  originalResumeFileId?: string | null;
  experiences: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  achievements: string[];
}

// ---- Job Analysis ----

export interface JobAnalysis {
  job_title: string;
  company: string;
  industry: string; // niche id, e.g. "tech-ai-fintech"
  seniority: string;
  location?: string;
  employment_type?: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  keywords: string[];
  soft_skills: string[];
  technologies: string[];
  domain_terms: string[];
  important_phrases: string[];
  tone: string;
  company_signals: string[];
  match_strategy: string;
}

// ---- Match Analysis ----

export interface EvidenceItem {
  requirement: string;
  status: 'strong' | 'partial' | 'missing';
  evidence: string | null;
  source: string | null; // e.g. "Experience: Codewalla" or "Project: FraudGraph AI"
}

export interface MatchAnalysis {
  overall_score: number;
  skills_score: number;
  experience_score: number;
  industry_score: number;
  keyword_score: number;
  education_score: number;
  responsibility_score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  evidence: EvidenceItem[];
  keywords_found: number;
  keywords_total: number;
}

// ---- Document generation ----

export type DocumentType =
  | 'resume_original'
  | 'resume_tailored'
  | 'cover_letter'
  | 'linkedin_about'
  | 'short_message'
  | 'recruiter_message';

export type Tone = 'professional' | 'confident' | 'technical' | 'startup' | 'corporate' | 'conversational';
export type Length = 'short' | 'medium' | 'detailed';
export type OptimizationLevel = 'light' | 'balanced' | 'aggressive';

export interface GenerationOptions {
  tone: Tone;
  length: Length;
  language: string;
  optimizationLevel: OptimizationLevel;
}

export interface ResumeSection {
  key: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications';
  before: string;
  after: string;
  changed: boolean;
}

export type ResumeSectionKey = 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'achievements';

export interface TailoredResumeDraft {
  headline: string;
  summary: { before: string; after: string; changed: boolean };
  skills: { before: string[]; after: string[]; changed: boolean };
  experiences: { entry: ExperienceEntry; beforeBullets: string[]; afterBullets: string[]; changed: boolean }[];
  projects: { entry: ProjectEntry; beforeBullets: string[]; afterBullets: string[]; changed: boolean }[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  achievements: string[];
  omittedKeywords: string[]; // JD keywords intentionally NOT added (no evidence)
  /** Suggested order (AI-picked); the user can reorder and toggle inclusion in the editor. */
  sectionOrder: ResumeSectionKey[];
  includedSections: Record<ResumeSectionKey, boolean>;
}

export interface CoverLetterDraft {
  header: {
    candidateName: string;
    date: string;
    company: string;
    hiringManager?: string;
  };
  opening: string;
  body: string[];
  domainParagraph: string;
  closing: string;
  signature: string;
}

export interface DesignTemplate {
  id?: string;
  name: string;
  industry: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'relaxed';
  layout: 'single-column' | 'two-column';
  headerStyle: 'classic' | 'modern' | 'minimal';
  sectionStyle: 'underline' | 'bold-caps' | 'plain';
  accentStyle: 'minimal' | 'accent-bar' | 'none';
  atsSafe: boolean;
}

export interface ATSAnalysis {
  score: number;
  keywordCoverage: number;
  skillsMatch: number;
  formattingSafe: boolean;
  keywordsFound: string[];
  keywordsMissing: string[];
  issues: string[];
  recommendedAdditions: { keyword: string; reason: string }[];
}
