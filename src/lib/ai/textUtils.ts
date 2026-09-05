export function splitSentences(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#./\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function containsTerm(haystack: string, term: string): boolean {
  const h = ` ${normalize(haystack)} `;
  const t = ` ${normalize(term)} `;
  return h.includes(t);
}

/** Extract the most frequent multi-word phrases as a crude "important phrases" signal. */
export function extractPhrases(text: string, max = 8): string[] {
  const sentences = splitSentences(text);
  const candidates = sentences
    .filter((s) => s.split(' ').length <= 14 && s.split(' ').length >= 3)
    .slice(0, 40);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const key = normalize(c);
    if (!seen.has(key) && key.length > 10) {
      seen.add(key);
      out.push(c.replace(/^[-*•]\s*/, ''));
    }
    if (out.length >= max) break;
  }
  return out;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const REQUIREMENT_LEADIN_RE =
  /\b(?:experience (?:with|in|using)|proficiency (?:with|in)|knowledge of|familiarity with|skilled? (?:with|in)|expertise in|background in|understanding of|working with|hands-on (?:with|experience with))\s+([A-Za-z][A-Za-z0-9+#./&' -]{1,40}?)(?=[,.;:]|\s+\band\b|\s+\bor\b|$)/gi;
const COMMON_ACRONYM_EXCLUDE = new Set(['US', 'UK', 'EU', 'ID', 'IT', 'HR', 'PM', 'OK', 'AM', 'PM', 'CEO', 'CTO', 'CFO']);

/**
 * Niche-agnostic requirement extraction: pulls candidate skill/tool terms
 * straight out of the JD text via lead-in phrases ("experience with X",
 * "knowledge of Y") and short all-caps acronyms (CRM, SEO, HIPAA...),
 * rather than relying on a per-industry dictionary. Used as a fallback so a
 * JD in an industry without a fleshed-out niche dictionary still yields
 * real requirements to match against, instead of an empty list.
 */
export function extractGenericRequirements(text: string, max = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (term: string) => {
    const clean = term.trim().replace(/\s+/g, ' ');
    const key = normalize(clean);
    if (clean.length < 2 || clean.length > 40 || seen.has(key)) return;
    seen.add(key);
    out.push(clean);
  };

  for (const m of text.matchAll(REQUIREMENT_LEADIN_RE)) {
    if (out.length >= max) break;
    push(m[1]);
  }

  for (const m of text.matchAll(/\b[A-Z]{2,6}\b/g)) {
    if (out.length >= max) break;
    if (!COMMON_ACRONYM_EXCLUDE.has(m[0])) push(m[0]);
  }

  return out.slice(0, max);
}
