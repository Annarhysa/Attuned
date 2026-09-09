'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobAnalysis } from '@/types';
import { Loader2, Upload } from 'lucide-react';

export function JobInput({ onAnalyzed }: { onAnalyzed: (jobId: string, analysis: JobAnalysis) => void }) {
  const [jd, setJd] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submitPasteOrKeywords(sourceType: 'paste' | 'keywords', text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/jobs/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceType, text }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not analyze this job.');
      return;
    }
    const data = await res.json();
    onAnalyzed(data.jobId, data.analysis);
  }

  async function submitFile(file: File) {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('sourceType', 'upload');
    formData.append('file', file);
    const res = await fetch('/api/jobs/analyze', { method: 'POST', body: formData });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not analyze this job.');
      return;
    }
    const data = await res.json();
    onAnalyzed(data.jobId, data.analysis);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="paste">
          <TabsList>
            <TabsTrigger value="paste">Paste Job Description</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-4 space-y-3">
            <Textarea rows={14} placeholder="Paste the job description here..." value={jd} onChange={(e) => setJd(e.target.value)} disabled={loading} />
            <Button onClick={() => submitPasteOrKeywords('paste', jd)} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? 'Analyzing...' : 'Analyze Job'}
            </Button>
          </TabsContent>

          <TabsContent value="keywords" className="mt-4 space-y-3">
            <Input
              placeholder="Python, Machine Learning, AWS, FinTech, Fraud Detection, SQL"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Comma-separated keywords. Less precise than a full job description, but still analyzed for industry, tone, and skill signals.</p>
            <Button onClick={() => submitPasteOrKeywords('keywords', keywords)} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? 'Analyzing...' : 'Analyze Job'}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <label
              className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-center ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary'}`}
            >
              {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
              <span className="text-sm font-medium">{loading ? 'Analyzing...' : 'Click to upload PDF, DOCX, or TXT'}</span>
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" disabled={loading} onChange={(e) => e.target.files?.[0] && submitFile(e.target.files[0])} />
            </label>
          </TabsContent>
        </Tabs>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
