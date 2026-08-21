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
