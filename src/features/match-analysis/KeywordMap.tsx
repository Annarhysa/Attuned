import { MatchAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react';

const STATUS_META = {
  strong: { icon: CheckCircle2, color: 'text-success', label: 'Strong Match' },
  partial: { icon: MinusCircle, color: 'text-warning', label: 'Partial Match' },
  missing: { icon: XCircle, color: 'text-destructive', label: 'Not Found' },
};

export function KeywordMap({ match }: { match: MatchAnalysis }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Job Requirement → Candidate Evidence</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {match.evidence.length === 0 && (
          <p className="text-sm text-muted-foreground">No specific requirements were detected in this job description to map against your profile.</p>
        )}
        {match.evidence.map((e) => {
          const meta = STATUS_META[e.status];
          const Icon = meta.icon;
          return (
            <div key={e.requirement} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{e.requirement}</span>
                <span className={`flex items-center gap-1 text-sm ${meta.color}`}><Icon className="h-4 w-4" /> {meta.label}</span>
              </div>
              {e.evidence ? (
                <p className="mt-1 text-sm text-muted-foreground">Evidence: &quot;{e.evidence}&quot; <span className="text-xs">({e.source})</span></p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">No evidence of {e.requirement} was found in your profile.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
