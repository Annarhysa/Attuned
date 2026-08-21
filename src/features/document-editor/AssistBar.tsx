'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssistAction } from '@/lib/ai/textAssist';

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
}: {
  applicationId: string;
  text: string;
  onApply: (newText: string) => void;
}) {
  const [pending, setPending] = useState<{ action: string; text: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: AssistAction) {
    setLoading(action);
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ACTIONS.map((a) => (
          <Button key={a.key} size="sm" variant="outline" disabled={loading === a.key} onClick={() => run(a.key)}>
            {loading === a.key ? '...' : a.label}
          </Button>
        ))}
      </div>
      {pending && (
        <div className="rounded-md border border-border bg-muted/60 p-3 text-sm">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">AI suggestion</p>
          <p className="mb-2">{pending.text}</p>
          <p className="mb-2 text-xs text-muted-foreground">{pending.explanation}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { onApply(pending.text); setPending(null); }}>Accept</Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>Reject</Button>
          </div>
        </div>
      )}
    </div>
  );
}
