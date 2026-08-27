import { CandidateProfile } from '@/types';

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /^(summary|professional summary|profile|about( me)?|objective)\s*:?$/i,
  experience: /^(experience|work experience|professional experience|employment history|work history|relevant experience)\s*:?$/i,
  education: /^(education|academic background|academic history)\s*:?$/i,
  skills: /^(skills|technical skills|core competencies|core skills|technical proficiencies|skills\s*&\s*tools|technologies)\s*:?$/i,
  projects: /^(projects|personal projects|selected projects|academic projects|key projects)\s*:?$/i,
  certifications: /^(certifications?|licenses?|certifications?\s*&\s*licenses)\s*:?$/i,
  achievements: /^(achievements|awards|honors|honou?rs\s*&\s*awards)\s*:?$/i,
};

const DEGREE_HINT = /\b(bachelor|master|ph\.?d|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|mba|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?)\b/i;
const DATE_RANGE_RE = /(\w+\.?\s?\d{4}|\d{4})\s*(?:[-–—]|to)\s*(\w+\.?\s?\d{4}|\d{4}|present|current)/i;
const YEAR_RE = /\b(19|20)\d{2}\b/;
const BULLET_RE = /^[-*•‣◦]\s*/;

/**
 * Splits the resume into named sections, PRESERVING blank lines as entry
 * separators within each section (needed so multi-line experience/education
 * entries -- "Title" then "Company | Dates" on the next line -- aren't
 * merged or split incorrectly).
 */
function splitIntoSections(text: string): Record<string, string[]> {
  const lines = text.replace(/\r/g, '').split('\n').map((l) => l.trim());
  const sections: Record<string, string[]> = { header: [] };
  let current = 'header';
  let sawContentInSection = false;

  for (const line of lines) {
    let matched = false;
    if (line) {
      for (const [key, re] of Object.entries(SECTION_HEADERS)) {
        if (re.test(line)) {
          current = key;
          sections[current] = sections[current] || [];
          matched = true;
          sawContentInSection = false;
          break;
        }
      }
    }
    if (matched) continue;
    if (!line && !sawContentInSection) continue; // skip leading blanks in a fresh section
    sections[current] = sections[current] || [];
    sections[current].push(line);
    if (line) sawContentInSection = true;
  }

  // Trim trailing blank lines from every section.
  for (const key of Object.keys(sections)) {
    while (sections[key].length && !sections[key][sections[key].length - 1]) sections[key].pop();
  }
  return sections;
}

/** Groups a section's lines into blocks, split on blank-line separators. */
function chunkByBlankLines(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (!line) {
      if (current.length) chunks.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function extractContact(headerLines: string[]) {
  const nonEmpty = headerLines.filter(Boolean);
  const text = nonEmpty.join(' ');
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || '';
  const phone = text.match(/(\+?\(?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || '';
  const linkedin = text.match(/(https?:\/\/)?(www\.)?linkedin\.com\/[^\s,|]+/i)?.[0] || '';
  const github = text.match(/(https?:\/\/)?(www\.)?github\.com\/[^\s,|]+/i)?.[0] || '';
  const otherUrl = text.match(/https?:\/\/(?!.*(linkedin|github))[^\s,|]+/i)?.[0] || '';
  // Location: only trust a header LINE that is *entirely* a "City, ST"/"City, Country"
  // shape (not a substring match against the joined header, which can bleed into an
  // adjacent title line like "...Engineer" + "Austin, TX").
  const locationLineRe = /^[A-Z][a-zA-Z.'\-]+(?:\s[A-Z][a-zA-Z.'\-]+)?,\s*[A-Z][a-zA-Z]+$/;
  const location = nonEmpty.find((l) => locationLineRe.test(l)) || '';

  // A line is "contact noise" (not a name/title) if it carries an email, phone,
  // URL, or a bare social handle like "linkedin.com/in/x" or "github.com/x"
  // that has no http:// prefix to trip the URL check.
  const isContactLine = (l: string) =>
    /[@]/.test(l) || /\d{3}/.test(l) || /^https?:\/\//i.test(l) || /\b(linkedin|github)\.com\//i.test(l);

  // Name: first line that isn't contact info and isn't the resume's own section noise.
  const name = nonEmpty.find((l) => l.length > 1 && l.length < 60 && !isContactLine(l)) || '';

  // Professional title: the header line right after the name, if it reads like a role
  // (short, no contact markers, not the location string we already extracted).
  const nameIdx = nonEmpty.indexOf(name);
  let professionalTitle = '';
  if (nameIdx >= 0) {
    for (let i = nameIdx + 1; i < nonEmpty.length; i++) {
      const candidate = nonEmpty[i];
      if (!candidate || candidate === location) continue;
      if (isContactLine(candidate)) continue;
      if (candidate.length < 80) professionalTitle = candidate;
      break;
    }
  }

  return { name, email, phone, linkedin, github, portfolio: otherUrl, location, professionalTitle };
}

/** Splits a header line like "Software Engineer | Codewalla | Remote" into parts, minus any date range. */
function splitHeaderLine(line: string): string[] {
  const withoutDate = line.replace(DATE_RANGE_RE, '').replace(YEAR_RE, '');
  return withoutDate
    .split(/\s*[|,]\s*|\s+[-–—]\s+|\s+at\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseExperienceBlock(lines: string[]) {
  const experiences: CandidateProfile['experiences'] = [];

  for (const chunk of chunkByBlankLines(lines)) {
    const bulletStart = chunk.findIndex((l) => BULLET_RE.test(l));
    const headerLines = bulletStart === -1 ? chunk : chunk.slice(0, bulletStart);
    const bodyLines = bulletStart === -1 ? [] : chunk.slice(bulletStart);

    const dateLine = headerLines.find((l) => DATE_RANGE_RE.test(l)) || '';
    const dateMatch = dateLine.match(DATE_RANGE_RE);

    let title = '';
    let company = '';
    let location = '';

    if (headerLines.length >= 2) {
      // Convention: title on its own line, "Company | Location | Dates" (or similar) below.
      title = headerLines[0];
      const companyLineParts = splitHeaderLine(headerLines[1]);
      company = companyLineParts[0] || '';
      location = companyLineParts[1] || '';
    } else if (headerLines.length === 1) {
      const parts = splitHeaderLine(headerLines[0]);
      title = parts[0] || '';
      company = parts[1] || '';
      location = parts[2] || '';
    }

    const bullets = bodyLines
      .filter((l) => l)
      .map((l) => (BULLET_RE.test(l) ? l.replace(BULLET_RE, '') : l));

    if (!title && !company && bullets.length === 0) continue;

    experiences.push({
      company,
      title,
      location,
      startDate: dateMatch?.[1] || '',
      endDate: dateMatch?.[2] || '',
      bullets,
    });
  }

  return experiences;
}

function parseEducationBlock(lines: string[]) {
  const education: CandidateProfile['education'] = [];

  for (const chunk of chunkByBlankLines(lines)) {
    const degreeLineIdx = chunk.findIndex((l) => DEGREE_HINT.test(l));
    const institutionLine = chunk.find((l) => !DEGREE_HINT.test(l)) || chunk[0] || '';
    const degreeLine = degreeLineIdx >= 0 ? chunk[degreeLineIdx] : '';

    const dateMatch = chunk.join(' ').match(DATE_RANGE_RE);
    const singleYear = !dateMatch ? chunk.join(' ').match(YEAR_RE) : null;

    const institutionParts = splitHeaderLine(institutionLine);
    const degreeParts = degreeLine ? splitHeaderLine(degreeLine) : [];

    const details = chunk
      .filter((l) => l !== institutionLine && l !== degreeLine && !DATE_RANGE_RE.test(l))
      .join(' ');

    if (!institutionParts[0] && !degreeParts[0]) continue;

    education.push({
      institution: institutionParts[0] || '',
      degree: degreeParts[0] || (degreeLine || ''),
      field: degreeParts[1] || '',
      startDate: dateMatch?.[1] || '',
      endDate: dateMatch?.[2] || singleYear?.[0] || '',
      details,
    });
  }

  return education;
}

function parseSkillsBlock(lines: string[]) {
  const raw = lines.join(', ');
  return raw
    .split(/,|•|\||\n/)
    .map((s) => s.replace(/^[-*]\s*/, '').trim())
    .filter((s) => s.length > 1 && s.length < 40)
    .map((name) => ({ name, category: 'technical' as const }));
}

function parseProjectsBlock(lines: string[]) {
  const projects: CandidateProfile['projects'] = [];

  for (const chunk of chunkByBlankLines(lines)) {
    const bulletStart = chunk.findIndex((l) => BULLET_RE.test(l));
    const headerLines = bulletStart === -1 ? chunk.slice(0, 1) : chunk.slice(0, bulletStart);
    const bodyLines = bulletStart === -1 ? chunk.slice(1) : chunk.slice(bulletStart);

    const nameParts = splitHeaderLine(headerLines[0] || '');
    const bullets = bodyLines.filter(Boolean).map((l) => (BULLET_RE.test(l) ? l.replace(BULLET_RE, '') : l));
    const techLine = bodyLines.find((l) => /^(tech(nologies)?|stack|tools)\s*:/i.test(l));
    const technologies = techLine ? techLine.replace(/^(tech(nologies)?|stack|tools)\s*:/i, '').split(/,|\|/).map((t) => t.trim()).filter(Boolean) : [];

    if (!nameParts[0]) continue;

    projects.push({
      name: nameParts[0],
      description: nameParts.slice(1).join(', '),
      bullets: bullets.filter((b) => b !== techLine),
      technologies,
    });
  }

  return projects;
}

/**
 * Best-effort structured extraction from raw resume text. This is a
 * heuristic parser (section headers + line patterns), not a fabrication
 * engine -- every field it produces is copied from the source text, and
 * fields that can't be confidently identified are left blank (never filled
 * with placeholder text) so the verify-your-profile step can catch them.
 */
export function parseResumeText(rawText: string): CandidateProfile {
  const sections = splitIntoSections(rawText);
  const contact = extractContact(sections.header || []);

  return {
    fullName: contact.name,
    professionalTitle: contact.professionalTitle,
    location: contact.location,
    email: contact.email,
    phone: contact.phone,
    linkedin: contact.linkedin,
    github: contact.github,
    portfolio: contact.portfolio,
    summary: (sections.summary || []).join(' '),
    languages: [],
    experiences: parseExperienceBlock(sections.experience || []),
    education: parseEducationBlock(sections.education || []),
    projects: parseProjectsBlock(sections.projects || []),
    skills: parseSkillsBlock(sections.skills || []),
    certifications: (sections.certifications || []).filter(Boolean).map((name) => ({ name })),
    achievements: (sections.achievements || []).filter(Boolean),
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
