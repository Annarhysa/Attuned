'use client';

import { useState } from 'react';
import { ATSAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { scoreColorClass } from '@/lib/utils';
import { Loader2, ScanSearch } from 'lucide-react';

const ZERO_ATS: ATSAnalysis = {
  score: 0,
  keywordCoverage: 0,
  formattingSafe: true,
  skillsMatch: 0,
  keywordsFound: [],
  issues: [],
  recommendedAdditions: [],
  keywordsMissing: [],
};

export function ATSAnalyzerPanel({ applicationId }: { applicationId: string }) {
  const [ats, setAts] = useState<ATSAnalysis | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runCheck() {
    setLoading(true);
    setError('');
    const res = await fetch(`/api/applications/${applicationId}/ats`, { method: 'POST' });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not run ATS check.');
      return;
    }
    const data = await res.json();
    setAts(data.ats);
    setHasRun(true);
  }

  const display = ats ?? ZERO_ATS;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={runCheck} disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? 'Analyzing...' : hasRun ? 'Re-run ATS Check' : 'Run ATS Check'}
        </Button>
        {!hasRun && !loading && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ScanSearch className="h-4 w-4" /> Not run yet on this application -- metrics below are placeholders until you run it.
          </p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {
        <div className={`space-y-4 ${hasRun ? '' : 'opacity-60'}`}>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">ATS Score</CardTitle></CardHeader>
              <CardContent><p className={`text-3xl font-bold ${scoreColorClass(display.score)}`}>{display.score}/100</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Keyword Coverage</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{display.keywordCoverage}%</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Formatting</CardTitle></CardHeader>
              <CardContent>
                <Badge variant={display.formattingSafe ? 'success' : 'destructive'}>{display.formattingSafe ? 'ATS Safe' : 'Needs attention'}</Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Skills Match</CardTitle></CardHeader>
            <CardContent><Progress value={display.skillsMatch} /></CardContent>
          </Card>

          {display.issues.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Issues</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {display.issues.map((i) => <p key={i}>• {i}</p>)}
              </CardContent>
            </Card>
          )}

          {display.recommendedAdditions.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Additions</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {display.recommendedAdditions.map((r) => (
                  <div key={r.keyword} className="rounded-md bg-muted p-2">
                    <span className="font-medium">{r.keyword}</span> — <span className="text-muted-foreground">{r.reason}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {display.keywordsMissing.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Missing Keywords</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {display.keywordsMissing.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}
              </CardContent>
            </Card>
          )}
        </div>
      }
    </div>
  );
}
