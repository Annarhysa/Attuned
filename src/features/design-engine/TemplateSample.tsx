'use client';

import { CandidateProfile, DesignTemplate, TailoredResumeDraft } from '@/types';
import { Dialog } from '@/components/ui/dialog';
import { ResumePreview } from '@/features/document-editor/DocumentPreview';

const SAMPLE_PROFILE: CandidateProfile = {
  fullName: 'Jordan Rivera',
  professionalTitle: 'Senior Software Engineer',
  location: 'Austin, TX',
  email: 'jordan.rivera@email.com',
  phone: '(512) 555-0182',
  linkedin: 'linkedin.com/in/jordanrivera',
  github: 'github.com/jordanrivera',
  portfolio: '',
  summary: '',
  languages: [],
  experiences: [],
  education: [],
  projects: [],
  skills: [],
  certifications: [],
  achievements: [],
};

const SAMPLE_DRAFT: TailoredResumeDraft = {
  headline: 'Senior Software Engineer',
  summary: {
    before: '',
    after: 'Backend-focused engineer with 6+ years building scalable, reliable systems in fast-moving product teams.',
    changed: false,
  },
  skills: { before: [], after: ['Python', 'TypeScript', 'AWS', 'PostgreSQL', 'Docker', 'Kubernetes'], changed: false },
  experiences: [
    {
      entry: { company: 'Northwind Labs', title: 'Senior Software Engineer', location: 'Austin, TX', startDate: 'Jan 2022', endDate: 'Present', bullets: [] },
      beforeBullets: [],
      afterBullets: [
        'Led the migration of a monolith to microservices, cutting deploy time by 60%.',
        'Built a real-time analytics pipeline processing 2M+ events per day.',
      ],
      changed: false,
    },
    {
      entry: { company: 'Vantage Systems', title: 'Software Engineer', location: 'Remote', startDate: 'Jun 2019', endDate: 'Dec 2021', bullets: [] },
      beforeBullets: [],
      afterBullets: ['Shipped a customer-facing API used by 40+ enterprise clients.'],
      changed: false,
    },
  ],
  projects: [
    {
      entry: { name: 'OpenTrace', description: '', bullets: [], technologies: ['Go', 'gRPC'] },
      beforeBullets: [],
      afterBullets: ['Open-source distributed tracing tool with 1.2k GitHub stars.'],
      changed: false,
    },
  ],
  education: [
    { institution: 'University of Texas at Austin', degree: 'B.S. Computer Science', field: '', startDate: '2015', endDate: '2019', details: '' },
  ],
  certifications: [{ name: 'AWS Certified Solutions Architect' }],
  achievements: [],
  omittedKeywords: [],
  sectionOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'],
  includedSections: { summary: true, skills: true, experience: true, projects: true, education: true, certifications: true, achievements: true },
};

/** Renders a representative resume using placeholder content, so a design can be judged by how it actually looks rather than just its color swatch. */
export function TemplatePreviewDialog({ template, open, onClose }: { template: (DesignTemplate & { id?: string }) | null; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open && !!template} onClose={onClose} className="max-w-xl">
      {template && (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground">Sample content -- your actual resume will use this design.</p>
          </div>
          <ResumePreview profile={SAMPLE_PROFILE} draft={SAMPLE_DRAFT} design={template} />
        </div>
      )}
    </Dialog>
  );
}
