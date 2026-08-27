'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateProfile } from '@/types';
import { Loader2, Upload } from 'lucide-react';

export function ResumeUploader({ onExtracted }: { onExtracted: (profile: CandidateProfile, fileId?: string) => void }) {
  const [pasted, setPasted] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/resume/upload', { method: 'POST', body: formData });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Upload failed.');
      return;
    }
    const data = await res.json();
    onExtracted(data.profile, data.fileId);
  }

  async function handlePasteSubmit() {
    if (!pasted.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/resume/parse-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: pasted }),
    });
    setLoading(false);
    if (!res.ok) {
      setError('Could not parse resume text.');
      return;
    }
    const data = await res.json();
    onExtracted(data.profile);
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="upload">
          <TabsList>
            <TabsTrigger value="upload">Upload Resume</TabsTrigger>
            <TabsTrigger value="paste">Paste Resume Text</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <label
              className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-center ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary'}`}
            >
              {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
              <span className="text-sm font-medium">{loading ? 'Extracting your profile...' : 'Click to upload PDF, DOCX, or TXT'}</span>
              <span className="text-xs text-muted-foreground">Your original file is preserved and never modified.</span>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                disabled={loading}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </TabsContent>
          <TabsContent value="paste" className="mt-4 space-y-3">
            <Textarea rows={12} placeholder="Paste your resume text here..." value={pasted} onChange={(e) => setPasted(e.target.value)} disabled={loading} />
            <Button onClick={handlePasteSubmit} disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? 'Extracting...' : 'Extract Profile'}
            </Button>
          </TabsContent>
        </Tabs>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
