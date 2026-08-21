import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { CandidateProfile, CoverLetterDraft, DesignTemplate, TailoredResumeDraft } from '@/types';

const DEFAULT_DESIGN: DesignTemplate = {
  name: 'ATS Professional', industry: 'general', primaryColor: '#111827', secondaryColor: '#374151',
  font: 'Helvetica', fontSize: 'medium', spacing: 'normal', layout: 'single-column',
  headerStyle: 'classic', sectionStyle: 'plain', accentStyle: 'none', atsSafe: true,
};

function pdfStyles(design: DesignTemplate) {
  const fontSize = design.fontSize === 'small' ? 9 : design.fontSize === 'large' ? 11.5 : 10;
  const gap = design.spacing === 'compact' ? 4 : design.spacing === 'relaxed' ? 12 : 8;
  return StyleSheet.create({
    page: { padding: 40, fontSize, fontFamily: 'Helvetica', color: '#1a1a1a' },
    name: { fontSize: fontSize + 10, fontWeight: 700, color: design.primaryColor, marginBottom: 2 },
    title: { fontSize: fontSize + 2, color: design.secondaryColor, marginBottom: 6 },
    contact: { fontSize: fontSize - 1, color: '#4b5563', marginBottom: gap },
    sectionTitle: { fontSize: fontSize + 1, fontWeight: 700, color: design.primaryColor, marginTop: gap, marginBottom: 4, textTransform: design.sectionStyle === 'bold-caps' ? 'uppercase' : 'none', borderBottomWidth: design.sectionStyle === 'underline' ? 1 : 0, borderBottomColor: design.primaryColor, paddingBottom: 2 },
    entryHeader: { fontSize, fontWeight: 700, marginTop: 6 },
    entrySub: { fontSize: fontSize - 1, color: '#4b5563', marginBottom: 2 },
    bullet: { fontSize, marginBottom: 2, marginLeft: 10 },
    paragraph: { fontSize, marginBottom: gap, lineHeight: 1.4 },
  });
}

function ResumePDF({ profile, draft, design }: { profile: CandidateProfile; draft: TailoredResumeDraft; design: DesignTemplate }) {
  const s = pdfStyles(design);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{profile.fullName}</Text>
        <Text style={s.title}>{draft.headline || profile.professionalTitle}</Text>
        <Text style={s.contact}>
          {[profile.location, profile.email, profile.phone, profile.linkedin, profile.github, profile.portfolio].filter(Boolean).join('  |  ')}
        </Text>

        {draft.summary.after && (
          <View>
            <Text style={s.sectionTitle}>Summary</Text>
            <Text style={s.paragraph}>{draft.summary.after}</Text>
          </View>
        )}

        {draft.skills.after.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Skills</Text>
            <Text style={s.paragraph}>{draft.skills.after.join('  •  ')}</Text>
          </View>
        )}

        {draft.experiences.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Experience</Text>
            {draft.experiences.map((e, i) => (
              <View key={i}>
                <Text style={s.entryHeader}>{e.entry.title} — {e.entry.company}</Text>
                <Text style={s.entrySub}>{e.entry.startDate} – {e.entry.endDate || 'Present'}{e.entry.location ? ` · ${e.entry.location}` : ''}</Text>
                {e.afterBullets.map((b, bi) => <Text key={bi} style={s.bullet}>• {b}</Text>)}
              </View>
            ))}
          </View>
        )}

        {draft.projects.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Projects</Text>
            {draft.projects.map((p, i) => (
              <View key={i}>
                <Text style={s.entryHeader}>{p.entry.name}{p.entry.technologies.length ? ` (${p.entry.technologies.join(', ')})` : ''}</Text>
                {p.afterBullets.map((b, bi) => <Text key={bi} style={s.bullet}>• {b}</Text>)}
              </View>
            ))}
          </View>
        )}

        {draft.education.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Education</Text>
            {draft.education.map((e, i) => (
              <View key={i}>
                <Text style={s.entryHeader}>{e.degree}{e.field ? `, ${e.field}` : ''}</Text>
                <Text style={s.entrySub}>{e.institution} {e.endDate ? `· ${e.endDate}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        {draft.certifications.length > 0 && (
          <View>
            <Text style={s.sectionTitle}>Certifications</Text>
            {draft.certifications.map((c, i) => <Text key={i} style={s.bullet}>• {c.name}{c.issuer ? ` — ${c.issuer}` : ''}</Text>)}
          </View>
        )}
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
          <Text style={s.paragraph}>{letter.opening}</Text>
          {letter.body.map((p, i) => <Text key={i} style={s.paragraph}>{p}</Text>)}
          <Text style={s.paragraph}>{letter.domainParagraph}</Text>
          <Text style={s.paragraph}>{letter.closing}</Text>
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

export async function renderResumeDOCX(profile: CandidateProfile, draft: TailoredResumeDraft): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: profile.fullName, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: draft.headline || profile.professionalTitle }),
    new Paragraph({ text: [profile.location, profile.email, profile.phone, profile.linkedin, profile.github].filter(Boolean).join(' | ') }),
  ];

  if (draft.summary.after) {
    children.push(new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: draft.summary.after }));
  }
  if (draft.skills.after.length) {
    children.push(new Paragraph({ text: 'Skills', heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: draft.skills.after.join(', ') }));
  }
  if (draft.experiences.length) {
    children.push(new Paragraph({ text: 'Experience', heading: HeadingLevel.HEADING_2 }));
    for (const e of draft.experiences) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${e.entry.title} — ${e.entry.company}`, bold: true })] }));
      children.push(new Paragraph({ text: `${e.entry.startDate} – ${e.entry.endDate || 'Present'}` }));
      for (const b of e.afterBullets) children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
    }
  }
  if (draft.projects.length) {
    children.push(new Paragraph({ text: 'Projects', heading: HeadingLevel.HEADING_2 }));
    for (const p of draft.projects) {
      children.push(new Paragraph({ children: [new TextRun({ text: p.entry.name, bold: true })] }));
      for (const b of p.afterBullets) children.push(new Paragraph({ text: b, bullet: { level: 0 } }));
    }
  }
  if (draft.education.length) {
    children.push(new Paragraph({ text: 'Education', heading: HeadingLevel.HEADING_2 }));
    for (const e of draft.education) {
      children.push(new Paragraph({ text: `${e.degree}${e.field ? ', ' + e.field : ''} — ${e.institution}` }));
    }
  }
  if (draft.certifications.length) {
    children.push(new Paragraph({ text: 'Certifications', heading: HeadingLevel.HEADING_2 }));
    for (const c of draft.certifications) children.push(new Paragraph({ text: c.name, bullet: { level: 0 } }));
  }

  const doc = new DocxDocument({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function renderCoverLetterDOCX(letter: CoverLetterDraft): Promise<Buffer> {
  const children: Paragraph[] = [
    new Paragraph({ text: letter.header.candidateName, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: letter.header.date }),
    new Paragraph({ text: letter.header.company }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: letter.opening }),
    ...letter.body.map((p) => new Paragraph({ text: p })),
    new Paragraph({ text: letter.domainParagraph }),
    new Paragraph({ text: letter.closing }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: `Sincerely,` }),
    new Paragraph({ text: letter.signature }),
  ];
  const doc = new DocxDocument({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
