import { CandidateProfile, CoverLetterDraft, DesignTemplate, ResumeSectionKey, TailoredResumeDraft } from '@/types';

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'];
const ALL_INCLUDED: Record<ResumeSectionKey, boolean> = { summary: true, skills: true, experience: true, projects: true, education: true, certifications: true, achievements: true };

/** Drafts saved before section ordering existed won't have these fields -- fall back to showing everything in the default order. */
export function resolveSectionLayout(draft: TailoredResumeDraft): { order: ResumeSectionKey[]; included: Record<ResumeSectionKey, boolean> } {
  const order = draft.sectionOrder?.length ? draft.sectionOrder : DEFAULT_SECTION_ORDER;
  const included = draft.includedSections || ALL_INCLUDED;
  return { order, included };
}

const DEFAULT_DESIGN: DesignTemplate = {
  name: 'ATS Professional', industry: 'general', primaryColor: '#111827', secondaryColor: '#374151',
  font: 'Helvetica, Arial, sans-serif', fontSize: 'medium', spacing: 'normal', layout: 'single-column',
  headerStyle: 'classic', sectionStyle: 'plain', accentStyle: 'none', atsSafe: true,
};

function previewFontStack(font: string): string {
  const lower = font.toLowerCase();
  if (/(georgia|times|serif|garamond|cambria)/.test(lower)) return `Georgia, 'Times New Roman', serif`;
  if (/(courier|mono|consolas)/.test(lower)) return `'Courier New', monospace`;
  if (/poppins/.test(lower)) return `'Trebuchet MS', sans-serif`;
  return `Inter, system-ui, sans-serif`;
}

function SectionTitle({ children, design }: { children: React.ReactNode; design: DesignTemplate }) {
  return (
    <p
      className="mb-1.5 mt-4 text-xs font-bold tracking-wide"
      style={{
        color: design.primaryColor,
        textTransform: design.sectionStyle === 'bold-caps' ? 'uppercase' : 'none',
        borderBottom: design.sectionStyle === 'underline' ? `1.5px solid ${design.primaryColor}` : 'none',
        paddingBottom: design.sectionStyle === 'underline' ? 2 : 0,
      }}
    >
      {children}
    </p>
  );
}

export function ResumePreview({
  profile,
  draft,
  design,
  highlight,
  onSectionClick,
}: {
  profile: CandidateProfile;
  draft: TailoredResumeDraft;
  design?: DesignTemplate | null;
  highlight?: ResumeSectionKey | null;
  /** Lets the preview double as navigation: clicking a section (or a specific entry) jumps the editor there. */
  onSectionClick?: (key: ResumeSectionKey, entryIdx?: number) => void;
}) {
  const d = design || DEFAULT_DESIGN;
  const fontFamily = previewFontStack(d.font);
  const pad = d.spacing === 'compact' ? '1.25rem' : d.spacing === 'relaxed' ? '2.5rem' : '1.75rem';
  const clickable = !!onSectionClick;

  const box = (key: typeof highlight, children: React.ReactNode) => (
    <div
      className={[
        highlight === key ? 'rounded ring-2 ring-primary/60 ring-offset-2' : '',
        clickable ? 'cursor-pointer rounded transition-colors hover:bg-primary/5' : '',
      ].join(' ')}
      onClick={clickable && key ? () => onSectionClick!(key) : undefined}
    >
      {children}
    </div>
  );

  const entryBox = (key: ResumeSectionKey, idx: number, children: React.ReactNode) => (
    <div
      key={idx}
      className={clickable ? 'cursor-pointer rounded px-1 -mx-1 transition-colors hover:bg-primary/5' : ''}
      onClick={clickable ? (e) => { e.stopPropagation(); onSectionClick!(key, idx); } : undefined}
    >
      {children}
    </div>
  );

  const { order, included } = resolveSectionLayout(draft);

  const sections: Partial<Record<ResumeSectionKey, React.ReactNode>> = {
    summary: draft.summary.after && (
      <div>
        <SectionTitle design={d}>Summary</SectionTitle>
        <p className="whitespace-pre-wrap leading-relaxed">{draft.summary.after}</p>
      </div>
    ),
    skills: draft.skills.after.length > 0 && (
      <div>
        <SectionTitle design={d}>Skills</SectionTitle>
        <p>{draft.skills.after.join('  •  ')}</p>
      </div>
    ),
    experience: draft.experiences.length > 0 && (
      <div>
        <SectionTitle design={d}>Experience</SectionTitle>
        {draft.experiences.map((e, i) => entryBox('experience', i, (
          <div className="mb-2">
            <p className="font-semibold">{[e.entry.title, e.entry.company].filter(Boolean).join(' — ') || 'Untitled role'}</p>
            <p className="text-xs text-gray-500">{[e.entry.startDate && `${e.entry.startDate} – ${e.entry.endDate || 'Present'}`, e.entry.location].filter(Boolean).join(' · ')}</p>
            <ul className="ml-4 list-disc">
              {e.afterBullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
            </ul>
          </div>
        )))}
      </div>
    ),
    projects: draft.projects.length > 0 && (
      <div>
        <SectionTitle design={d}>Projects</SectionTitle>
        {draft.projects.map((p, i) => entryBox('projects', i, (
          <div className="mb-2">
            <p className="font-semibold">{p.entry.name}{p.entry.technologies.length ? ` (${p.entry.technologies.join(', ')})` : ''}</p>
            <ul className="ml-4 list-disc">
              {p.afterBullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
            </ul>
          </div>
        )))}
      </div>
    ),
    education: draft.education.length > 0 && (
      <div>
        <SectionTitle design={d}>Education</SectionTitle>
        {draft.education.map((e, i) => (
          <div key={i} className="mb-1">
            <p className="font-semibold">{[e.degree, e.field].filter(Boolean).join(', ')}</p>
            <p className="text-xs text-gray-500">{[e.institution, e.endDate].filter(Boolean).join(' · ')}</p>
          </div>
        ))}
      </div>
    ),
    certifications: draft.certifications.length > 0 && (
      <div>
        <SectionTitle design={d}>Certifications</SectionTitle>
        <ul className="ml-4 list-disc">
          {draft.certifications.map((c, i) => <li key={i}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</li>)}
        </ul>
      </div>
    ),
    achievements: draft.achievements && draft.achievements.length > 0 && (
      <div>
        <SectionTitle design={d}>Achievements & Leadership</SectionTitle>
        <ul className="ml-4 list-disc">
          {draft.achievements.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
      </div>
    ),
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div style={{ fontFamily, padding: pad, color: '#1a1a1a', fontSize: d.fontSize === 'small' ? 12 : d.fontSize === 'large' ? 15 : 13.5 }}>
        <p className="text-2xl font-bold" style={{ color: d.primaryColor }}>{profile.fullName || 'Your Name'}</p>
        {(draft.headline || profile.professionalTitle) && (
          <p className="mb-1 text-base" style={{ color: d.secondaryColor }}>{draft.headline || profile.professionalTitle}</p>
        )}
        <p className="text-xs text-gray-500">
          {[profile.location, profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join('  |  ') || 'Add contact details in your profile'}
        </p>

        {order.filter((key) => included[key]).map((key) => sections[key] && <div key={key}>{box(key, sections[key])}</div>)}
      </div>
    </div>
  );
}

export function CoverLetterPreview({ letter, design }: { letter: CoverLetterDraft; design?: DesignTemplate | null }) {
  const d = design || DEFAULT_DESIGN;
  const fontFamily = previewFontStack(d.font);
  const pad = d.spacing === 'compact' ? '1.25rem' : d.spacing === 'relaxed' ? '2.5rem' : '1.75rem';

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      <div style={{ fontFamily, padding: pad, color: '#1a1a1a', fontSize: d.fontSize === 'small' ? 12 : d.fontSize === 'large' ? 15 : 13.5 }}>
        <p className="text-2xl font-bold" style={{ color: d.primaryColor }}>{letter.header.candidateName}</p>
        <p className="text-xs text-gray-500">{letter.header.date}</p>
        <p className="mb-4 text-xs text-gray-500">{letter.header.company}{letter.header.hiringManager ? ` · Attn: ${letter.header.hiringManager}` : ''}</p>
        <div className="space-y-3 leading-relaxed">
          {letter.opening && <p>{letter.opening}</p>}
          {letter.body.filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          {letter.domainParagraph && <p>{letter.domainParagraph}</p>}
          {letter.closing && <p>{letter.closing}</p>}
          <p>Sincerely,<br />{letter.signature}</p>
        </div>
      </div>
    </div>
  );
}
