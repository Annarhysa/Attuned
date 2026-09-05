'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Loader2 } from 'lucide-react';

const FORMAT_META: Record<string, { label: string; ext: string }> = {
  'resume-pdf': { label: 'Resume — PDF', ext: 'pdf' },
  'resume-docx': { label: 'Resume — DOCX', ext: 'docx' },
  'cover-pdf': { label: 'Cover Letter — PDF', ext: 'pdf' },
  'cover-docx': { label: 'Cover Letter — DOCX', ext: 'docx' },
  package: { label: 'Application Package', ext: 'zip' },
};

export function ExportPanel({ applicationId }: { applicationId: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function download(format: string) {
    setPending(format);
    setError('');
    try {
      const res = await fetch(`/api/applications/${applicationId}/export?format=${format}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Export failed.');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] || `download.${FORMAT_META[format]?.ext || 'bin'}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPending(null);
    }
  }

  return (
    <Card data-tour="export-panel">
      <CardHeader><CardTitle className="text-base">Export</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {(['resume-pdf', 'resume-docx', 'cover-pdf', 'cover-docx'] as const).map((format) => (
            <Button key={format} variant="outline" className="justify-start gap-2" disabled={pending === format} onClick={() => download(format)}>
              {pending === format ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {FORMAT_META[format].label}
            </Button>
          ))}
        </div>
        <Button className="w-full gap-2" disabled={pending === 'package'} onClick={() => download('package')}>
          {pending === 'package' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {pending === 'package' ? 'Preparing package...' : 'Download Application Package'}
        </Button>
      </CardContent>
    </Card>
  );
}
