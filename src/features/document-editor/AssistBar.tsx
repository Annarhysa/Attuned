'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssistAction } from '@/lib/ai/textAssist';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const ACTIONS: { key: AssistAction; label: string }[] = [
  { key: 'improve', label: 'Improve' },
  { key: 'shorten', label: 'Shorten' },
  { key: 'more_technical', label: 'More Technical' },
  { key: 'more_professional', label: 'More Professional' },
  { key: 'add_keywords', label: 'Add Keywords' },
  { key: 'remove_repetition', label: 'Remove Repetition' },
  { key: 'improve_ats', label: 'Improve ATS' },
];

export function AssistBar({
  applicationId,
  text,
  onApply,
  compact = false,
}: {
  applicationId: string;
  text: string;
  onApply: (newText: string) => void;
  /** Collapsed behind a small toggle -- for per-bullet use where a full action row would be too heavy. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const [pending, setPending] = useState<{ action: string; text: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: AssistAction) {
    if (!text.trim()) return;
    setLoading(action);
    setPending(null);
    const res = await fetch(`/api/applications/${applicationId}/assist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text }),
    });
    setLoading(null);
    if (!res.ok) return;
    const data = await res.json();
    setPending({ action, text: data.text, explanation: data.explanation });
  }

  if (compact && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Sparkles className="h-3 w-3" /> AI assist <ChevronDown className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {compact && (
        <button type="button" onClick={() => setOpen(false)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          <Sparkles className="h-3 w-3" /> AI assist <ChevronUp className="h-3 w-3" />
        </button>
      )}
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((a) => (
          <Button key={a.key} size="sm" variant="outline" disabled={!!loading} onClick={() => run(a.key)}>
            {loading === a.key ? <Loader2 className="h-3 w-3 animate-spin" /> : a.label}
          </Button>
        ))}
      </div>
      {pending && (
        <div className="rounded-md border border-border bg-muted/60 p-3 text-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI suggestion</p>
          <p className="mb-2">{pending.text}</p>
          <p className="mb-2 text-xs text-muted-foreground">{pending.explanation}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onApply(pending.text); setPending(null); if (compact) setOpen(false); }}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>Reject</Button>
          </div>
        </div>
      )}
    </div>
  );
}
