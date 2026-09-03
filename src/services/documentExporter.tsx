import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { CandidateProfile, CoverLetterDraft, DesignTemplate, ResumeSectionKey, TailoredResumeDraft } from '@/types';
import { resolveSectionLayout } from '@/features/document-editor/DocumentPreview';

const DEFAULT_DESIGN: DesignTemplate = {
  name: 'ATS Professional', industry: 'general', primaryColor: '#111827', secondaryColor: '#374151',
  font: 'Helvetica', fontSize: 'medium', spacing: 'normal', layout: 'single-column',
  headerStyle: 'classic', sectionStyle: 'plain', accentStyle: 'none', atsSafe: true,
};

// react-pdf only ships a handful of built-in fonts (custom fonts need explicit
// registration, which isn't worth the fragility here) -- map each design's
// chosen font to the closest built-in family so serif/monospace designs
// (FinTech's Georgia, Legal's Georgia, Engineering's monospace-leaning look)
// still render visibly differently from the sans-serif default.
function pdfFontFamily(font: string): string {
  const lower = font.toLowerCase();
  if (/(georgia|times|serif|garamond|cambria)/.test(lower)) return 'Times-Roman';
  if (/(courier|mono|consolas)/.test(lower)) return 'Courier';
  return 'Helvetica';
}

function pdfFontFamilyBold(font: string): string {
  const family = pdfFontFamily(font);
  if (family === 'Times-Roman') return 'Times-Bold';
  if (family === 'Courier') return 'Courier-Bold';
  return 'Helvetica-Bold';
}

function pdfStyles(design: DesignTemplate) {
  const fontSize = design.fontSize === 'small' ? 9 : design.fontSize === 'large' ? 11.5 : 10;
  const gap = design.spacing === 'compact' ? 4 : design.spacing === 'relaxed' ? 12 : 8;
  const family = pdfFontFamily(design.font);
  const familyBold = pdfFontFamilyBold(design.font);
  return StyleSheet.create({
    page: { padding: 40, fontSize, fontFamily: family, color: '#1a1a1a' },
    name: { fontSize: fontSize + 10, fontFamily: familyBold, color: design.primaryColor, marginBottom: 2 },
    title: { fontSize: fontSize + 2, color: design.secondaryColor, marginBottom: 6 },
    contact: { fontSize: fontSize - 1, color: '#4b5563', marginBottom: gap },
    sectionTitle: { fontSize: fontSize + 1, fontFamily: familyBold, color: design.primaryColor, marginTop: gap, marginBottom: 4, textTransform: design.sectionStyle === 'bold-caps' ? 'uppercase' : 'none', borderBottomWidth: design.sectionStyle === 'underline' ? 1 : 0, borderBottomColor: design.primaryColor, paddingBottom: 2 },
    entryHeader: { fontSize, fontFamily: familyBold, marginTop: 6 },
    entrySub: { fontSize: fontSize - 1, color: '#4b5563', marginBottom: 2 },
    bullet: { fontSize, marginBottom: 2, marginLeft: 10 },
    paragraph: { fontSize, marginBottom: gap, lineHeight: 1.4 },
  });
}

function entryTitleLine(title: string, company: string): string {
  if (title && company) return `${title} — ${company}`;
  return title || company;
}

function ResumePDF({ profile, draft, design }: { profile: CandidateProfile; draft: TailoredResumeDraft; design: DesignTemplate }) {
  const s = pdfStyles(design);
  const { order, included } = resolveSectionLayout(draft);

  const sections: Partial<Record<ResumeSectionKey, React.ReactNode>> = {
    summary: draft.summary.after && (
      <View>
        <Text style={s.sectionTitle}>Summary</Text>
        <Text style={s.paragraph}>{draft.summary.after}</Text>
      </View>
    ),
    skills: draft.skills.after.length > 0 && (
      <View>
        <Text style={s.sectionTitle}>Skills</Text>
        <Text style={s.paragraph}>{draft.skills.after.join('  •  ')}</Text>
      </View>
    ),
    experience: draft.experiences.length > 0 && (
      <View>
        <Text style={s.sectionTitle}>Experience</Text>
        {draft.experiences.map((e, i) => (
          <View key={i} wrap={false}>
            {entryTitleLine(e.entry.title, e.entry.company) && <Text style={s.entryHeader}>{entryTitleLine(e.entry.title, e.entry.company)}</Text>}
            {(e.entry.startDate || e.entry.endDate || e.entry.location) && (
              <Text style={s.entrySub}>
                {[e.entry.startDate && `${e.entry.startDate} – ${e.entry.endDate || 'Present'}`, e.entry.location].filter(Boolean).join(' · ')}
              </Text>
            )}
            {e.afterBullets.filter(Boolean).map((b, bi) => <Text key={bi} style={s.bullet}>• {b}</Text>)}
          </View>
        ))}
      </View>
    ),
    projects: draft.projects.length > 0 && (
      <View>
        <Text style={s.sectionTitle}>Projects</Text>
        {draft.projects.map((p, i) => (
          <View key={i} wrap={false}>
            <Text style={s.entryHeader}>{p.entry.name}{p.entry.technologies.length ? ` (${p.entry.technologies.join(', ')})` : ''}</Text>
            {p.afterBullets.filter(Boolean).map((b, bi) => <Text key={bi} style={s.bullet}>• {b}</Text>)}
          </View>
        ))}
      </View>
    ),
    education: draft.education.length > 0 && (
      <View>
        <Text style={s.sectionTitle}>Education</Text>
        {draft.education.map((e, i) => (
          <View key={i} wrap={false}>
            {(e.degree || e.field) && <Text style={s.entryHeader}>{[e.degree, e.field].filter(Boolean).join(', ')}</Text>}
            {(e.institution || e.endDate) && <Text style={s.entrySub}>{[e.institution, e.endDate].filter(Boolean).join(' · ')}</Text>}
          </View>
        ))}
      </View>
    ),
    certifications: draft.certifications.length > 0 && (
      <View>
        <Text style={s.sectionTitle}>Certifications</Text>
        {draft.certifications.map((c, i) => <Text key={i} style={s.bullet}>• {c.name}{c.issuer ? ` — ${c.issuer}` : ''}</Text>)}
      </View>
    ),
    achievements: draft.achievements && draft.achievements.length > 0 && (
      <View>
        <Text style={s.sectionTitle}>Achievements & Leadership</Text>
        {draft.achievements.map((a, i) => <Text key={i} style={s.bullet}>• {a}</Text>)}
      </View>
    ),
  };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{profile.fullName}</Text>
        {(draft.headline || profile.professionalTitle) && <Text style={s.title}>{draft.headline || profile.professionalTitle}</Text>}
        <Text style={s.contact}>
          {[profile.location, profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join('  |  ')}
        </Text>

        {order.filter((key) => included[key]).map((key) => sections[key] && <React.Fragment key={key}>{sections[key]}</React.Fragment>)}
      </Page>
    </Document>
  );
}

function CoverLetterPDF({ letter, design }: { letter: CoverLetterDraft; design: DesignTemplate }) {
  const s = pdfStyles(design);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{letter.header.candidateName}</Text>
        <Text style={s.contact}>{letter.header.date}</Text>
        <Text style={s.contact}>{letter.header.company}{letter.header.hiringManager ? ` · Attn: ${letter.header.hiringManager}` : ''}</Text>
        <View style={{ marginTop: 16 }}>
          {letter.opening && <Text style={s.paragraph}>{letter.opening}</Text>}
          {letter.body.filter(Boolean).map((p, i) => <Text key={i} style={s.paragraph}>{p}</Text>)}
          {letter.domainParagraph && <Text style={s.paragraph}>{letter.domainParagraph}</Text>}
          {letter.closing && <Text style={s.paragraph}>{letter.closing}</Text>}
          <Text style={s.paragraph}>Sincerely,{'\n'}{letter.signature}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderResumePDF(profile: CandidateProfile, draft: TailoredResumeDraft, design?: DesignTemplate | null): Promise<Buffer> {
  return renderToBuffer(<ResumePDF profile={profile} draft={draft} design={design || DEFAULT_DESIGN} />);
}

export async function renderCoverLetterPDF(letter: CoverLetterDraft, design?: DesignTemplate | null): Promise<Buffer> {
  return renderToBuffer(<CoverLetterPDF letter={letter} design={design || DEFAULT_DESIGN} />);
}

function docxHexColor(hex: string): string {
  return hex.replace('#', '').toUpperCase();
}

function docxHeading(text: string, design: DesignTemplate, size = 24): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    border: design.sectionStyle === 'underline' ? { bottom: { color: docxHexColor(design.primaryColor), space: 2, style: 'single', size: 6 } } : undefined,
    children: [
      new TextRun({
        text: design.sectionStyle === 'bold-caps' ? text.toUpperCase() : text,
        bold: true,
        color: docxHexColor(design.primaryColor),
        size,
        font: design.font,
      }),
    ],
  });
}

export async function renderResumeDOCX(profile: CandidateProfile, draft: TailoredResumeDraft, design?: DesignTemplate | null): Promise<Buffer> {
  const d = design || DEFAULT_DESIGN;
  const baseSize = d.fontSize === 'small' ? 20 : d.fontSize === 'large' ? 26 : 22;

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: profile.fullName, bold: true, size: baseSize + 12, color: docxHexColor(d.primaryColor), font: d.font })],
    }),
  ];
  const headline = draft.headline || profile.professionalTitle;
  if (headline) {
    children.push(new Paragraph({ children: [new TextRun({ text: headline, size: baseSize + 2, color: docxHexColor(d.secondaryColor), font: d.font })] }));
  }
  const contactLine = [profile.location, profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join('  |  ');
  if (contactLine) {
    children.push(new Paragraph({ children: [new TextRun({ text: contactLine, size: baseSize - 2, color: '4B5563', font: d.font })] }));
  }

  const sectionParagraphs: Partial<Record<ResumeSectionKey, Paragraph[]>> = {};

  if (draft.summary.after) {
    sectionParagraphs.summary = [
      docxHeading('Summary', d, baseSize + 2),
      new Paragraph({ children: [new TextRun({ text: draft.summary.after, size: baseSize, font: d.font })] }),
    ];
  }
  if (draft.skills.after.length) {
    sectionParagraphs.skills = [
      docxHeading('Skills', d, baseSize + 2),
      new Paragraph({ children: [new TextRun({ text: draft.skills.after.join(', '), size: baseSize, font: d.font })] }),
    ];
  }
  if (draft.experiences.length) {
    const paras: Paragraph[] = [docxHeading('Experience', d, baseSize + 2)];
    for (const e of draft.experiences) {
      const titleLine = e.entry.title && e.entry.company ? `${e.entry.title} — ${e.entry.company}` : e.entry.title || e.entry.company;
      if (titleLine) paras.push(new Paragraph({ children: [new TextRun({ text: titleLine, bold: true, size: baseSize, font: d.font })] }));
      const dateLine = [e.entry.startDate && `${e.entry.startDate} – ${e.entry.endDate || 'Present'}`, e.entry.location].filter(Boolean).join(' · ');
      if (dateLine) paras.push(new Paragraph({ children: [new TextRun({ text: dateLine, italics: true, size: baseSize - 2, color: '4B5563', font: d.font })] }));
      for (const b of e.afterBullets.filter(Boolean)) {
        paras.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: baseSize, font: d.font })] }));
      }
    }
    sectionParagraphs.experience = paras;
  }
  if (draft.projects.length) {
    const paras: Paragraph[] = [docxHeading('Projects', d, baseSize + 2)];
    for (const p of draft.projects) {
      const label = p.entry.technologies.length ? `${p.entry.name} (${p.entry.technologies.join(', ')})` : p.entry.name;
      paras.push(new Paragraph({ children: [new TextRun({ text: label, bold: true, size: baseSize, font: d.font })] }));
      for (const b of p.afterBullets.filter(Boolean)) {
        paras.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: baseSize, font: d.font })] }));
      }
    }
    sectionParagraphs.projects = paras;
  }
  if (draft.education.length) {
    const paras: Paragraph[] = [docxHeading('Education', d, baseSize + 2)];
    for (const e of draft.education) {
      const degreeLine = [e.degree, e.field].filter(Boolean).join(', ');
      if (degreeLine) paras.push(new Paragraph({ children: [new TextRun({ text: degreeLine, bold: true, size: baseSize, font: d.font })] }));
      const instLine = [e.institution, e.endDate].filter(Boolean).join(' · ');
      if (instLine) paras.push(new Paragraph({ children: [new TextRun({ text: instLine, size: baseSize - 2, color: '4B5563', font: d.font })] }));
    }
    sectionParagraphs.education = paras;
  }
  if (draft.certifications.length) {
    const paras: Paragraph[] = [docxHeading('Certifications', d, baseSize + 2)];
    for (const c of draft.certifications) {
      paras.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: c.name + (c.issuer ? ` — ${c.issuer}` : ''), size: baseSize, font: d.font })] }));
    }
    sectionParagraphs.certifications = paras;
  }
  if (draft.achievements && draft.achievements.length) {
    const paras: Paragraph[] = [docxHeading('Achievements & Leadership', d, baseSize + 2)];
    for (const a of draft.achievements) {
      paras.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: a, size: baseSize, font: d.font })] }));
    }
    sectionParagraphs.achievements = paras;
  }

  const { order } = resolveSectionLayout(draft);
  const includedForOrder = draft.includedSections || { summary: true, skills: true, experience: true, projects: true, education: true, certifications: true, achievements: true };
  for (const key of order) {
    if (!includedForOrder[key]) continue;
    const paras = sectionParagraphs[key];
    if (paras) children.push(...paras);
  }

  const doc = new DocxDocument({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function renderCoverLetterDOCX(letter: CoverLetterDraft, design?: DesignTemplate | null): Promise<Buffer> {
  const d = design || DEFAULT_DESIGN;
  const baseSize = d.fontSize === 'small' ? 20 : d.fontSize === 'large' ? 26 : 22;

  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: letter.header.candidateName, bold: true, size: baseSize + 12, color: docxHexColor(d.primaryColor), font: d.font })] }),
    new Paragraph({ children: [new TextRun({ text: letter.header.date, size: baseSize - 2, color: '4B5563', font: d.font })] }),
    new Paragraph({
      children: [new TextRun({ text: letter.header.company + (letter.header.hiringManager ? ` · Attn: ${letter.header.hiringManager}` : ''), size: baseSize - 2, color: '4B5563', font: d.font })],
    }),
    new Paragraph({ text: '' }),
  ];

  const paragraphs = [letter.opening, ...letter.body, letter.domainParagraph, letter.closing].filter(Boolean);
  for (const p of paragraphs) {
    children.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: p, size: baseSize, font: d.font })] }));
  }

  children.push(new Paragraph({ text: '' }));
  children.push(new Paragraph({ children: [new TextRun({ text: 'Sincerely,', size: baseSize, font: d.font })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: letter.signature, size: baseSize, font: d.font })] }));

  const doc = new DocxDocument({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
