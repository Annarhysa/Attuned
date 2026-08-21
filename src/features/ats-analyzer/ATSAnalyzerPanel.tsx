'use client';

import { useState } from 'react';
import { ATSAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { scoreColorClass } from '@/lib/utils';

export function ATSAnalyzerPanel({ applicationId }: { applicationId: string }) {
  const [ats, setAts] = useState<ATSAnalysis | null>(null);
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
  }

  return (
    <div className="space-y-4">
      <Button onClick={runCheck} disabled={loading}>{loading ? 'Analyzing...' : 'Run ATS Check'}</Button>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {ats && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">ATS Score</CardTitle></CardHeader>
              <CardContent><p className={`text-3xl font-bold ${scoreColorClass(ats.score)}`}>{ats.score}/100</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Keyword Coverage</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{ats.keywordCoverage}%</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1"><CardTitle className="text-sm text-muted-foreground">Formatting</CardTitle></CardHeader>
              <CardContent>
                <Badge variant={ats.formattingSafe ? 'success' : 'destructive'}>{ats.formattingSafe ? 'ATS Safe' : 'Needs attention'}</Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Skills Match</CardTitle></CardHeader>
            <CardContent><Progress value={ats.skillsMatch} /></CardContent>
          </Card>

          {ats.issues.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Issues</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {ats.issues.map((i) => <p key={i}>• {i}</p>)}
              </CardContent>
            </Card>
          )}

          {ats.recommendedAdditions.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended Additions</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {ats.recommendedAdditions.map((r) => (
                  <div key={r.keyword} className="rounded-md bg-muted p-2">
                    <span className="font-medium">{r.keyword}</span> — <span className="text-muted-foreground">{r.reason}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {ats.keywordsMissing.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Missing Keywords</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {ats.keywordsMissing.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
