import { MatchAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MinusCircle, XCircle, ArrowRight } from 'lucide-react';

const STATUS_META = {
  strong: { icon: CheckCircle2, color: 'text-success', label: 'Strong Match', order: 2 },
  partial: { icon: MinusCircle, color: 'text-warning', label: 'Partial Match', order: 1 },
  missing: { icon: XCircle, color: 'text-destructive', label: 'Not Found', order: 0 },
};

export function KeywordMap({ match, onGenerate }: { match: MatchAnalysis; onGenerate?: () => void }) {
  const missingCount = match.evidence.filter((e) => e.status === 'missing').length;
  const partialCount = match.evidence.filter((e) => e.status === 'partial').length;
  const strongCount = match.evidence.filter((e) => e.status === 'strong').length;
  // Gaps first -- they're the actionable part; strong matches are just confirmation.
  const sorted = [...match.evidence].sort((a, b) => STATUS_META[a.status].order - STATUS_META[b.status].order);

  return (
    <Card data-tour="keyword-map">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-base">Job Requirement → Candidate Evidence</CardTitle>
        <p className="text-sm text-muted-foreground">
          This is what your match score is actually built from -- every requirement the job mentions, and whether your profile backs it up.
          {missingCount > 0
            ? ` The ${missingCount} "Not Found" item${missingCount > 1 ? 's' : ''} below are your fastest wins: if you genuinely have that experience, add it to your profile so a tailored resume can surface it.`
            : ' Your profile already covers everything this job asks for.'}
        </p>
        <div className="flex flex-wrap gap-3 pt-1 text-xs">
          <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" /> {missingCount} not found</span>
          <span className="flex items-center gap-1 text-warning"><MinusCircle className="h-3.5 w-3.5" /> {partialCount} partial</span>
          <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> {strongCount} strong</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {match.evidence.length === 0 && (
          <p className="text-sm text-muted-foreground">No specific requirements were detected in this job description to map against your profile.</p>
        )}
        {sorted.map((e) => {
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
        {match.evidence.length > 0 && onGenerate && (
          <Button variant="outline" className="w-full gap-2" onClick={onGenerate}>
            Generate a tailored resume using this evidence <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
