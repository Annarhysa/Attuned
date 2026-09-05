'use client';

import { useState } from 'react';
import { CandidateProfile, CoverLetterDraft, DesignTemplate, ResumeSectionKey, TailoredResumeDraft } from '@/types';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

export const DEFAULT_SECTION_ORDER: ResumeSectionKey[] = ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'achievements'];
const ALL_INCLUDED: Record<ResumeSectionKey, boolean> = { summary: true, skills: true, experience: true, projects: true, education: true, certifications: true, achievements: true };

export const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  achievements: 'Achievements & Leadership',
};

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
  editable,
  onReorderSections,
  onToggleSection,
}: {
  profile: CandidateProfile;
  draft: TailoredResumeDraft;
  design?: DesignTemplate | null;
  highlight?: ResumeSectionKey | null;
  /** Lets the preview double as navigation: clicking a section (or a specific entry) jumps the editor there. */
  onSectionClick?: (key: ResumeSectionKey, entryIdx?: number) => void;
  /** Turns on drag-to-reorder and hide/show controls directly on the preview -- the section management UI itself. */
  editable?: boolean;
  onReorderSections?: (order: ResumeSectionKey[]) => void;
  onToggleSection?: (key: ResumeSectionKey) => void;
}) {
  const d = design || DEFAULT_DESIGN;
  const fontFamily = previewFontStack(d.font);
  const pad = d.spacing === 'compact' ? '1.25rem' : d.spacing === 'relaxed' ? '2.5rem' : '1.75rem';
  const clickable = !!onSectionClick;
  const [dragKey, setDragKey] = useState<ResumeSectionKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<ResumeSectionKey | null>(null);

  const box = (key: typeof highlight, children: React.ReactNode) => (
    <div
      className={[
        highlight === key ? 'rounded ring-2 ring-primary/60 ring-offset-2' : '',
        clickable && !editable ? 'cursor-pointer rounded transition-colors hover:bg-primary/5' : '',
      ].join(' ')}
      onClick={clickable && !editable && key ? () => onSectionClick!(key) : undefined}
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

  function handleDrop(targetKey: ResumeSectionKey) {
    setDragOverKey(null);
    if (!dragKey || dragKey === targetKey || !onReorderSections) { setDragKey(null); return; }
    const movingDown = order.indexOf(dragKey) < order.indexOf(targetKey);
    const next = order.filter((k) => k !== dragKey);
    // Dropping onto a target below the dragged item should land it AFTER
    // that target -- inserting before it (the naive approach) is a no-op
    // when dropping on the very next item, since removal already shifted
    // everything up by one.
    const targetIdx = next.indexOf(targetKey) + (movingDown ? 1 : 0);
    next.splice(targetIdx, 0, dragKey);
    onReorderSections(next);
    setDragKey(null);
  }

  // In edit mode, every section is visible (even empty/hidden ones) so they
  // can still be reordered and toggled back on -- they just render dimmed
  // with a placeholder. Read-only mode (export preview, template samples)
  // only ever shows included sections with real content, as before.
  const renderOrder = editable ? order : order.filter((key) => included[key]);

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

        {renderOrder.map((key) => {
          const content = sections[key];
          if (!content && !editable) return null;
          if (!editable) return <div key={key}>{box(key, content)}</div>;

          return (
            <div
              key={key}
              draggable
              onDragStart={() => setDragKey(key)}
              onDragOver={(e) => { e.preventDefault(); if (dragOverKey !== key) setDragOverKey(key); }}
              onDragLeave={() => setDragOverKey((k) => (k === key ? null : k))}
              onDrop={() => handleDrop(key)}
              onDragEnd={() => { setDragKey(null); setDragOverKey(null); }}
              className={[
                'group relative rounded border transition-colors',
                dragOverKey === key && dragKey !== key ? 'border-dashed border-primary' : 'border-transparent',
                included[key] ? '' : 'opacity-40',
              ].join(' ')}
            >
              <div className="absolute -right-1 -top-1 z-10 flex items-center gap-0.5 rounded-md border border-border bg-white px-1 py-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <span className="cursor-grab text-gray-400 hover:text-gray-600" title="Drag to reorder">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleSection?.(key); }}
                  title={included[key] ? 'Hide from resume' : 'Show on resume'}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {included[key] ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
              </div>
              {box(key, content || <p className="text-xs italic text-gray-400">{SECTION_LABELS[key]} -- no content yet.</p>)}
            </div>
          );
        })}
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
