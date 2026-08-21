import { wordDiff } from '@/services/diff';

export function DiffView({ before, after }: { before: string; after: string }) {
  if (before === after) return <p className="text-sm">{after}</p>;
  const tokens = wordDiff(before, after);
  return (
    <p className="text-sm leading-relaxed">
      {tokens.map((t, i) => {
        if (t.type === 'same') return <span key={i}>{t.text}</span>;
        if (t.type === 'added') return <span key={i} className="rounded bg-success/15 text-success">{t.text}</span>;
        return <span key={i} className="rounded bg-destructive/10 text-destructive line-through">{t.text}</span>;
      })}
    </p>
  );
}
