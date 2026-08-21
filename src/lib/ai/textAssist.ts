import { EvidenceItem } from '@/types';
import { containsTerm } from './textUtils';

export type AssistAction =
  | 'improve'
  | 'shorten'
  | 'more_technical'
  | 'more_professional'
  | 'add_keywords'
  | 'remove_repetition'
  | 'improve_ats';

const FILLER_WORDS = ['very', 'really', 'basically', 'just', 'actually', 'a lot of', 'kind of', 'sort of'];
const WEAK_VERBS: Record<string, string> = {
  did: 'executed',
  made: 'built',
  'worked on': 'developed',
  helped: 'supported',
  used: 'applied',
  got: 'achieved',
};

export interface AssistResult {
  text: string;
  explanation: string;
}

/**
 * Deterministic, local text transforms. These reword/reorder/trim what's
 * already there -- they never introduce new facts. "add_keywords" only ever
 * inserts a keyword that has supporting evidence in the match analysis.
 */
export function applyAssist(action: AssistAction, text: string, evidence: EvidenceItem[] = []): AssistResult {
  switch (action) {
    case 'improve': {
      let out = text;
      for (const [weak, strong] of Object.entries(WEAK_VERBS)) {
        out = out.replace(new RegExp(`\\b${weak}\\b`, 'gi'), strong);
      }
      return { text: out, explanation: 'Replaced weak verbs (e.g. "worked on") with stronger, more specific ones already implied by your wording.' };
    }
    case 'shorten': {
      const sentences = text.split(/(?<=[.!?])\s+/);
      const out = sentences.slice(0, Math.max(1, Math.ceil(sentences.length * 0.7))).join(' ');
      const trimmed = out
        .split(' ')
        .filter((w) => !FILLER_WORDS.includes(w.toLowerCase()))
        .join(' ');
      return { text: trimmed, explanation: 'Removed filler words and trimmed to the most essential sentences.' };
    }
    case 'more_technical': {
      const strongTerms = evidence.filter((e) => e.status === 'strong').map((e) => e.requirement);
      const missingFromText = strongTerms.find((t) => !containsTerm(text, t));
      const out = missingFromText ? `${text} Applied ${missingFromText} directly in this work.` : text;
      return { text: out, explanation: missingFromText ? `Made the language more technical by naming "${missingFromText}", which your profile already evidences here.` : 'Already technical -- no unevidenced terms were added.' };
    }
    case 'more_professional': {
      const out = text
        .replace(/\bawesome\b/gi, 'effective')
        .replace(/\bstuff\b/gi, 'work')
        .replace(/!/g, '.');
      return { text: out, explanation: 'Swapped casual phrasing for more formal, professional language.' };
    }
    case 'add_keywords': {
      const candidates = evidence.filter((e) => e.status !== 'missing' && !containsTerm(text, e.requirement));
      if (candidates.length === 0) {
        return { text, explanation: 'No additional evidenced keywords to add without risking inaccuracy.' };
      }
      const term = candidates[0].requirement;
      return { text: `${text} (${term})`, explanation: `Added "${term}" -- it's evidenced in your ${candidates[0].source || 'profile'}, so it's safe to surface here.` };
    }
    case 'remove_repetition': {
      const words = text.split(' ');
      const seen = new Set<string>();
      const out: string[] = [];
      for (const w of words) {
        const key = w.toLowerCase().replace(/[^a-z]/g, '');
        if (key.length > 4 && seen.has(key)) continue;
        seen.add(key);
        out.push(w);
      }
      return { text: out.join(' '), explanation: 'Removed repeated significant words to tighten the phrasing.' };
    }
    case 'improve_ats': {
      const out = text.replace(/&/g, 'and').replace(/[^\x00-\x7F]/g, '');
      return { text: out, explanation: 'Removed special characters and symbols that can confuse ATS parsers.' };
    }
    default:
      return { text, explanation: 'No changes made.' };
  }
}
