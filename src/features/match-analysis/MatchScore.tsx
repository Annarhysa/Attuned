import { MatchAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { scoreColorClass, scoreLabel } from '@/lib/utils';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const BREAKDOWN: { key: keyof MatchAnalysis; label: string }[] = [
  { key: 'skills_score', label: 'Skills Match' },
  { key: 'experience_score', label: 'Experience Match' },
  { key: 'industry_score', label: 'Industry Match' },
  { key: 'keyword_score', label: 'Keyword Match' },
  { key: 'education_score', label: 'Education Match' },
  { key: 'responsibility_score', label: 'Responsibility Match' },
];

export function MatchScore({ match, title = 'Resume Match Score' }: { match: MatchAnalysis; title?: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className={`text-6xl font-bold ${scoreColorClass(match.overall_score)}`}>{match.overall_score}%</p>
          <p className={`text-lg font-medium ${scoreColorClass(match.overall_score)}`}>{scoreLabel(match.overall_score)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {BREAKDOWN.map(({ key, label }) => {
            const value = match[key] as number;
            return (
              <div key={label}>
                <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-medium">{value}%</span></div>
                <Progress value={value} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Strengths</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {match.strengths.length === 0 && <p className="text-sm text-muted-foreground">No strong matches found yet.</p>}
            {match.strengths.map((s) => (
              <div key={s} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-success" /> {s}</div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Gaps</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {match.gaps.length === 0 && <p className="text-sm text-muted-foreground">No significant gaps detected.</p>}
            {match.gaps.map((g) => (
              <div key={g} className="flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-warning" /> {g}</div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recommendations</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {match.recommendations.map((r, i) => (
            <p key={i} className="rounded-md bg-muted p-3 text-sm">{r}</p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Keyword Coverage</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span>JD Keywords Found</span>
            <span className="font-semibold">{match.keywords_found} / {match.keywords_total}</span>
          </div>
          <Progress className="mt-2" value={match.keyword_score} />
        </CardContent>
      </Card>
    </div>
  );
}
