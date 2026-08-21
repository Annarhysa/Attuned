'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { JobInput } from '@/features/job-input/JobInput';
import { JobIntelligence } from '@/features/job-input/JobIntelligence';
import { Button } from '@/components/ui/button';
import { JobAnalysis } from '@/types';
import { ArrowRight } from 'lucide-react';

export default function NewApplicationPage() {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [creating, setCreating] = useState(false);

  function handleAnalyzed(id: string, a: JobAnalysis) {
    setJobId(id);
    setAnalysis(a);
  }

  async function handleContinue() {
    if (!jobId) return;
    setCreating(true);
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.id) router.push(`/applications/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Application</h1>
        <p className="text-sm text-muted-foreground">Paste a job description, enter keywords, or upload a file to get started.</p>
      </div>

      {!analysis ? (
        <JobInput onAnalyzed={handleAnalyzed} />
      ) : (
        <div className="space-y-6">
          <JobIntelligence analysis={analysis} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setAnalysis(null); setJobId(null); }}>Start over</Button>
            <Button onClick={handleContinue} disabled={creating} className="gap-2">
              {creating ? 'Creating...' : 'Continue to Match Analysis'} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
