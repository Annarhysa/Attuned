import {
  CandidateProfile,
  CoverLetterDraft,
  DesignTemplate,
  GenerationOptions,
  JobAnalysis,
  MatchAnalysis,
  TailoredResumeDraft,
} from '@/types';

export interface AIProvider {
  readonly name: string;
  analyzeJob(rawText: string): Promise<JobAnalysis>;
  matchProfileToJob(profile: CandidateProfile, job: JobAnalysis): Promise<MatchAnalysis>;
  generateCoverLetter(
    profile: CandidateProfile,
    job: JobAnalysis,
    match: MatchAnalysis,
    options: GenerationOptions
  ): Promise<CoverLetterDraft>;
  tailorResume(
    profile: CandidateProfile,
    job: JobAnalysis,
    match: MatchAnalysis,
    options: GenerationOptions
  ): Promise<TailoredResumeDraft>;
  recommendDesign(job: JobAnalysis): Promise<DesignTemplate>;
}
