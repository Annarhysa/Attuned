import { CandidateProfile, CoverLetterDraft, DesignTemplate, TailoredResumeDraft } from '@/types';

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
}: {
  profile: CandidateProfile;
  draft: TailoredResumeDraft;
  design?: DesignTemplate | null;
  highlight?: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | null;
}) {
  const d = design || DEFAULT_DESIGN;
  const fontFamily = previewFontStack(d.font);
  const pad = d.spacing === 'compact' ? '1.25rem' : d.spacing === 'relaxed' ? '2.5rem' : '1.75rem';

  const box = (key: typeof highlight, children: React.ReactNode) => (
    <div className={highlight === key ? 'rounded ring-2 ring-primary/60 ring-offset-2' : ''}>{children}</div>
  );

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

        {draft.summary.after && box('summary', (
          <div>
            <SectionTitle design={d}>Summary</SectionTitle>
            <p className="whitespace-pre-wrap leading-relaxed">{draft.summary.after}</p>
          </div>
        ))}

        {draft.skills.after.length > 0 && box('skills', (
          <div>
            <SectionTitle design={d}>Skills</SectionTitle>
            <p>{draft.skills.after.join('  •  ')}</p>
          </div>
        ))}

        {draft.experiences.length > 0 && box('experience', (
          <div>
            <SectionTitle design={d}>Experience</SectionTitle>
            {draft.experiences.map((e, i) => (
              <div key={i} className="mb-2">
                <p className="font-semibold">{[e.entry.title, e.entry.company].filter(Boolean).join(' — ') || 'Untitled role'}</p>
                <p className="text-xs text-gray-500">{[e.entry.startDate && `${e.entry.startDate} – ${e.entry.endDate || 'Present'}`, e.entry.location].filter(Boolean).join(' · ')}</p>
                <ul className="ml-4 list-disc">
                  {e.afterBullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {draft.projects.length > 0 && box('projects', (
          <div>
            <SectionTitle design={d}>Projects</SectionTitle>
            {draft.projects.map((p, i) => (
              <div key={i} className="mb-2">
                <p className="font-semibold">{p.entry.name}{p.entry.technologies.length ? ` (${p.entry.technologies.join(', ')})` : ''}</p>
                <ul className="ml-4 list-disc">
                  {p.afterBullets.filter(Boolean).map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {draft.education.length > 0 && box('education', (
          <div>
            <SectionTitle design={d}>Education</SectionTitle>
            {draft.education.map((e, i) => (
              <div key={i} className="mb-1">
                <p className="font-semibold">{[e.degree, e.field].filter(Boolean).join(', ')}</p>
                <p className="text-xs text-gray-500">{[e.institution, e.endDate].filter(Boolean).join(' · ')}</p>
              </div>
            ))}
          </div>
        ))}

        {draft.certifications.length > 0 && box('certifications', (
          <div>
            <SectionTitle design={d}>Certifications</SectionTitle>
            <ul className="ml-4 list-disc">
              {draft.certifications.map((c, i) => <li key={i}>{c.name}{c.issuer ? ` — ${c.issuer}` : ''}</li>)}
            </ul>
          </div>
        ))}
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
