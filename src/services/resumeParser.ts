import { CandidateProfile } from '@/types';

const SECTION_HEADERS = {
  summary: /^(summary|professional summary|profile|about)\s*:?$/i,
  experience: /^(experience|work experience|professional experience|employment history)\s*:?$/i,
  education: /^(education|academic background)\s*:?$/i,
  skills: /^(skills|technical skills|core competencies)\s*:?$/i,
  projects: /^(projects|personal projects|selected projects)\s*:?$/i,
  certifications: /^(certifications?|licenses?)\s*:?$/i,
  achievements: /^(achievements|awards|honors)\s*:?$/i,
};

function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text.split('\n').map((l) => l.trim());
  const sections: Record<string, string[]> = { header: [] };
  let current = 'header';

  for (const line of lines) {
    if (!line) continue;
    let matched = false;
    for (const [key, re] of Object.entries(SECTION_HEADERS)) {
      if (re.test(line)) {
        current = key;
        sections[current] = sections[current] || [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      sections[current] = sections[current] || [];
      sections[current].push(line);
    }
  }
  return sections;
}

function extractContact(headerLines: string[]) {
  const text = headerLines.join(' ');
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || '';
  const phone = text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0] || '';
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s,]+/i)?.[0] || '';
  const github = text.match(/(https?:\/\/)?(www\.)?github\.com\/[^\s,]+/i)?.[0] || '';
  const name = headerLines.find((l) => l.length > 2 && l.length < 60 && !/@/.test(l) && !/\d{3}/.test(l)) || '';
  return { name, email, phone, linkedin, github };
}

function parseExperienceBlock(lines: string[]) {
  const experiences: CandidateProfile['experiences'] = [];
  let current: CandidateProfile['experiences'][number] | null = null;

  const dateRe = /(\b\d{4}\b|present)/i;
  for (const line of lines) {
    const looksLikeHeader = dateRe.test(line) && (line.includes('-') || line.includes('–') || line.includes('to'));
    const looksLikeBullet = /^[-*•]/.test(line);

    if (looksLikeBullet && current) {
      current.bullets.push(line.replace(/^[-*•]\s*/, ''));
    } else if (looksLikeHeader || (!current && line)) {
      if (current) experiences.push(current);
      const dateMatch = line.match(/(\w+\s?\d{4}|\d{4})\s*[-–to]+\s*(\w+\s?\d{4}|\d{4}|present)/i);
      const rest = line.replace(dateMatch?.[0] || '', '').trim();
      const [titlePart, companyPart] = rest.split(/,| at |\|/).map((s) => s?.trim()).filter(Boolean);
      current = {
        company: companyPart || '',
        title: titlePart || rest || 'Not specified',
        startDate: dateMatch?.[1] || '',
        endDate: dateMatch?.[2] || '',
        bullets: [],
      };
    } else if (current && line) {
      current.bullets.push(line);
    }
  }
  if (current) experiences.push(current);
  return experiences;
}

function parseEducationBlock(lines: string[]) {
  const education: CandidateProfile['education'] = [];
  let current: CandidateProfile['education'][number] | null = null;
  const dateRe = /\b\d{4}\b/;

  for (const line of lines) {
    if (dateRe.test(line) || /university|college|institute|school/i.test(line)) {
      if (current) education.push(current);
      const dateMatch = line.match(/(\d{4})\s*[-–to]*\s*(\d{4})?/);
      current = {
        institution: line.replace(dateMatch?.[0] || '', '').trim(),
        degree: '',
        startDate: dateMatch?.[1] || '',
        endDate: dateMatch?.[2] || '',
        details: '',
      };
    } else if (current) {
      if (!current.degree) current.degree = line;
      else current.details += (current.details ? ' ' : '') + line;
    }
  }
  if (current) education.push(current);
  return education;
}

function parseSkillsBlock(lines: string[]) {
  const raw = lines.join(', ');
  return raw
    .split(/,|•|\||\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40)
    .map((name) => ({ name, category: 'technical' as const }));
}

function parseProjectsBlock(lines: string[]) {
  const projects: CandidateProfile['projects'] = [];
  let current: CandidateProfile['projects'][number] | null = null;

  for (const line of lines) {
    const looksLikeBullet = /^[-*•]/.test(line);
    if (looksLikeBullet && current) {
      current.bullets.push(line.replace(/^[-*•]\s*/, ''));
    } else if (line) {
      if (current) projects.push(current);
      current = { name: line, description: '', bullets: [], technologies: [] };
    }
  }
  if (current) projects.push(current);
  return projects;
}

/**
 * Best-effort structured extraction from raw resume text. This is a
 * heuristic parser (section headers + line patterns), not a fabrication
 * engine -- every field it produces is copied from the source text.
 */
export function parseResumeText(rawText: string): CandidateProfile {
  const sections = splitIntoSections(rawText);
  const contact = extractContact(sections.header || []);

  return {
    fullName: contact.name,
    professionalTitle: '',
    location: '',
    email: contact.email,
    phone: contact.phone,
    linkedin: contact.linkedin,
    github: contact.github,
    portfolio: '',
    summary: (sections.summary || []).join(' '),
    languages: [],
    experiences: parseExperienceBlock(sections.experience || []),
    education: parseEducationBlock(sections.education || []),
    projects: parseProjectsBlock(sections.projects || []),
    skills: parseSkillsBlock(sections.skills || []),
    certifications: (sections.certifications || []).map((name) => ({ name })),
    achievements: sections.achievements || [],
  };
}

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString('utf-8');
}
