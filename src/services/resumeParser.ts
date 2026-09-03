import { CandidateProfile } from '@/types';

const SECTION_HEADERS: Record<string, RegExp> = {
  summary: /^(summary|professional summary|profile|about( me)?|objective)\s*:?$/i,
  experience: /^(experience|work experience|professional experience|employment history|work history|relevant experience)\s*:?$/i,
  education: /^(education|academic background|academic history)\s*:?$/i,
  skills: /^(skills|technical skills|core competencies|core skills|technical proficiencies|skills\s*&\s*tools|technologies)\s*:?$/i,
  projects: /^(projects|personal projects|selected projects|academic projects|key projects)\s*:?$/i,
  certifications: /^(certifications?|licenses?|certifications?\s*&\s*licenses)\s*:?$/i,
  // Everything here funnels into the same `achievements` bucket -- the schema
  // has no separate leadership/accomplishments field, and lumping these
  // together beats the previous behavior (unrecognized headers silently
  // bled their content into whatever section came before them).
  achievements: /^(achievements|accomplishments|awards|honors|honou?rs\s*&\s*awards|leadership(\s*(&|and)\s*volunteering)?|volunteering|extracurriculars?(\s*activities)?)\s*:?$/i,
};

const DEGREE_HINT = /\b(bachelor|master|ph\.?d|associate|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|mba|b\.?tech|m\.?tech|b\.?e\.?|m\.?e\.?)\b/i;
// Month names only (not a generic \w+) -- a generic word before the year
// swallows whatever precedes it when PDF extraction drops the space before a
// right-aligned date (e.g. "Engineer IJul 2025" -> matching "IJul 2025" as
// the date, corrupting both the title and the date). See normalizePdfText.
const MONTH_RE = '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DATE_RANGE_RE = new RegExp(`\\b(${MONTH_RE}\\.?\\s\\d{4}|\\d{4})\\s*(?:[-–—]|to)\\s*(${MONTH_RE}\\.?\\s\\d{4}|\\d{4}|present|current)\\b`, 'i');
const YEAR_RE = /\b(19|20)\d{2}\b/;
const BULLET_RE = /^[-*•‣◦]\s*/;
// Common job-title words, used to tell a title line apart from a company
// line when a 2-line entry header could go either order (see
// `splitTitleAndCompanyLine`).
const TITLE_KEYWORD_RE = /\b(engineer|developer|manager|analyst|scientist|intern|trainee|consultant|specialist|coordinator|designer|architect|director|lead|head of|officer|researcher|associate|assistant|administrator|executive|president|founder|ceo|cto|cfo|coo|vp|vice president|representative|technician|strategist|producer|editor|recruiter|accountant|auditor|advisor|advocate)\b/i;
const WORK_MODE_RE = /\((on-site|onsite|remote|hybrid)\)/i;

/**
 * Some PDF text extractors (pdf-parse included) drop the space between two
 * text runs when the gap between them came from font/position changes
 * rather than an actual space glyph -- very common right where a bullet's
 * title touches a right-aligned date, or a bold "Label:" touches the
 * regular text after it. Left alone this corrupts section/entry parsing
 * ("Protego:Created..." never matches a "Name: description" pattern,
 * "TraineeSep 2024" swallows into the date). These fixes only ever ADD a
 * space at a position that was already ambiguous, so they can't break text
 * that was extracted cleanly.
 */
function normalizePdfText(text: string): string {
  return text
    .replace(/:(?=[A-Za-z])/g, ': ') // "Label:Text" -> "Label: Text" (also catches "Label :Text")
    .replace(/(?<=[A-Za-z]{3})\.(?=[A-Z])/g, '. ') // "sentence.Next" -> "sentence. Next" -- requires 3+ letters before the period so single-initial abbreviations ("B.S.", "Ph.D.", "M.Sc.") are left alone
    .replace(new RegExp(`([a-zA-Z])(?=${MONTH_RE}\\.?\\s?\\d{4})`, 'gi'), '$1 ') // "EngineerIJul 2025" -> "Engineer IJul 2025"
    .replace(/([a-z])-\s+([a-z])/g, '$1$2'); // de-hyphenate a justified-text line-break ("explo- ration" -> "exploration"); real hyphenated compounds never have a space after the hyphen
}

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

/**
 * Groups a section's lines into per-entry blocks (one experience, one
 * project, ...), each with a header portion and a bulleted body. Blank
 * lines are one boundary signal, but not the only one -- PDF text
 * extraction from tightly-typeset templates often drops the blank lines
 * between visually-separated entries entirely. The reliable signal is
 * structural: once we've started reading an entry's bullets, the next
 * non-bullet line can only be the start of a NEW entry's header, never a
 * continuation of the old one.
 */
const SENTENCE_END_RE = /[.!?]['"”)\]]*$/;
const TECH_LABEL_RE = /^(tech(nologies)?|stack|tools)\s*:/i;

function chunkEntries(lines: string[]): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let inBullets = false;

  for (const line of lines) {
    if (!line) {
      if (current.length) chunks.push(current);
      current = [];
      inBullets = false;
      continue;
    }
    const isBullet = BULLET_RE.test(line);
    if (!isBullet && inBullets) {
      // A non-bulleted line here is either the start of a new entry, or a
      // wrapped continuation of the previous bullet (no marker on line 2 of
      // a long bullet). Treat it as a continuation -- fold it back onto the
      // previous line -- unless the previous bullet reads as a finished
      // sentence AND this line doesn't look like a mid-sentence trailer.
      const prevIdx = current.length - 1;
      const prev = current[prevIdx];
      // Strong signals that this line is a new entry's header, regardless of
      // whether the previous bullet happened to end without a period (e.g.
      // trailing "...by 30%") -- a work-mode marker or a full date range
      // essentially never appears mid-sentence inside a bullet (unlike a
      // title keyword, which could show up in ordinary prose).
      const looksLikeNewHeader = WORK_MODE_RE.test(line) || DATE_RANGE_RE.test(line);
      const looksLikeContinuation =
        !looksLikeNewHeader &&
        prev !== undefined &&
        (!SENTENCE_END_RE.test(prev.trim()) || /^[a-z]/.test(line) || TECH_LABEL_RE.test(line));
      if (looksLikeContinuation) {
        current[prevIdx] = `${prev} ${line}`;
        continue;
      }
      if (current.length) chunks.push(current);
      current = [];
      inBullets = false;
    }
    current.push(line);
    if (isBullet) inBullets = true;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

/**
 * Given the (up to two) non-bulleted header lines of an experience entry,
 * decides which is the title and which is the company/location/dates line.
 * Templates disagree on the order (title-then-company is at least as common
 * as company-then-title), so this leans on a job-title keyword dictionary
 * rather than assuming a fixed position.
 */
function splitTitleAndCompanyLine(lineA: string, lineB: string): { titleLine: string; companyLine: string } {
  const aIsTitle = TITLE_KEYWORD_RE.test(lineA);
  const bIsTitle = TITLE_KEYWORD_RE.test(lineB);
  if (bIsTitle && !aIsTitle) return { titleLine: lineB, companyLine: lineA };
  return { titleLine: lineA, companyLine: lineB }; // default / both-or-neither: assume title-first convention
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

  for (const chunk of chunkEntries(lines)) {
    const bulletStart = chunk.findIndex((l) => BULLET_RE.test(l));
    const headerLines = bulletStart === -1 ? chunk : chunk.slice(0, bulletStart);
    const bodyLines = bulletStart === -1 ? [] : chunk.slice(bulletStart);

    const dateLine = headerLines.find((l) => DATE_RANGE_RE.test(l)) || '';
    const dateMatch = dateLine.match(DATE_RANGE_RE);

    let title = '';
    let company = '';
    let location = '';

    if (headerLines.length >= 2) {
      const { titleLine, companyLine } = splitTitleAndCompanyLine(headerLines[0], headerLines[1]);
      title = titleLine.replace(DATE_RANGE_RE, '').replace(YEAR_RE, '').trim();
      const companyLineParts = splitHeaderLine(companyLine.replace(/\((on-site|onsite|remote|hybrid)\)/i, '').trim());
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

  // Blank lines are the primary boundary, but PDF extraction often drops the
  // blank line between consecutive degree entries -- so also split whenever
  // a second degree-hint line ("Master of Science...", "Bachelor of...")
  // shows up inside what would otherwise be one chunk.
  const chunks: string[][] = [];
  for (const rawChunk of chunkByBlankLines(lines)) {
    let current: string[] = [];
    let seenDegree = false;
    for (const line of rawChunk) {
      if (DEGREE_HINT.test(line) && seenDegree && current.length) {
        chunks.push(current);
        current = [];
        seenDegree = false;
      }
      current.push(line);
      if (DEGREE_HINT.test(line)) seenDegree = true;
    }
    if (current.length) chunks.push(current);
  }

  for (const chunk of chunks) {
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

/**
 * For flat bullet-list sections (achievements, certifications): folds a
 * wrapped continuation line (no bullet marker, same as the entry-splitting
 * problem above) back onto the bullet it belongs to, and strips markers.
 */
function mergeWrappedBullets(lines: string[]): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if (!line) continue;
    if (BULLET_RE.test(line)) {
      out.push(line.replace(BULLET_RE, ''));
    } else if (out.length) {
      out[out.length - 1] = `${out[out.length - 1]} ${line}`;
    } else {
      out.push(line);
    }
  }
  return out;
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

  // A project title reads like "Name:" or "Name (Tech):" at the start of a line/bullet.
  const titlePrefixRe = /^[A-Z][A-Za-z0-9 /&+#.'-]{1,50}:\s/;

  for (const chunk of chunkEntries(lines)) {
    const bulletStart = chunk.findIndex((l) => BULLET_RE.test(l));
    const headerLines = bulletStart === -1 ? chunk.slice(0, 1) : chunk.slice(0, bulletStart);
    const bodyLines = bulletStart === -1 ? chunk.slice(1) : chunk.slice(bulletStart);
    const bulletLines = bodyLines.filter((l) => BULLET_RE.test(l)).map((l) => l.replace(BULLET_RE, ''));

    // Convention: a flat list of one-bullet-per-project lines, e.g.
    // "Protego: Created a crime-awareness dashboard... Tech: Python, NLP."
    // -- no separate header line, each bullet is a whole project on its own.
    if (headerLines.length === 0 && bulletLines.length > 1 && bulletLines.every((b) => titlePrefixRe.test(b))) {
      for (const b of bulletLines) {
        const colonIdx = b.indexOf(':');
        const name = b.slice(0, colonIdx).trim();
        let description = b.slice(colonIdx + 1).trim();
        const techMatch = description.match(/\bTech(nologies)?\s*:\s*([^.]+)\.?\s*$/i);
        const technologies = techMatch ? techMatch[2].split(/,|\|/).map((t) => t.trim()).filter(Boolean) : [];
        if (techMatch) description = description.slice(0, techMatch.index).trim();
        if (!name) continue;
        projects.push({ name, description, bullets: [], technologies });
      }
      continue;
    }

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
export function parseResumeText(rawTextIn: string): CandidateProfile {
  const rawText = normalizePdfText(rawTextIn);
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
    certifications: mergeWrappedBullets(sections.certifications || []).map((name) => ({ name })),
    achievements: mergeWrappedBullets(sections.achievements || []),
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
