'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Download, Eye, Loader2 } from 'lucide-react';
import { CandidateProfile, CoverLetterDraft, DesignTemplate, TailoredResumeDraft } from '@/types';
import { ResumePreview, CoverLetterPreview } from './DocumentPreview';

const FORMAT_META: Record<string, { label: string; ext: string; needs: 'resume' | 'cover' }> = {
  'resume-pdf': { label: 'Resume — PDF', ext: 'pdf', needs: 'resume' },
  'resume-docx': { label: 'Resume — DOCX', ext: 'docx', needs: 'resume' },
  'cover-pdf': { label: 'Cover Letter — PDF', ext: 'pdf', needs: 'cover' },
  'cover-docx': { label: 'Cover Letter — DOCX', ext: 'docx', needs: 'cover' },
};

export function ExportPanel({
  applicationId,
  profile,
  draft,
  letter,
  design,
}: {
  applicationId: string;
  profile: CandidateProfile;
  draft: TailoredResumeDraft | null;
  letter: CoverLetterDraft | null;
  design: (DesignTemplate & { id: string }) | null;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<'resume' | 'cover' | null>(null);

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

  const hasResume = !!draft;
  const hasCover = !!letter;

  return (
    <Card data-tour="export-panel">
      <CardHeader><CardTitle className="text-base">Export</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            variant="outline"
            className="justify-start gap-2"
            disabled={!hasResume}
            title={hasResume ? undefined : 'Generate a tailored resume first'}
            onClick={() => setPreview('resume')}
          >
            <Eye className="h-4 w-4" /> Preview Resume{design ? ` (${design.name})` : ''}
          </Button>
          <Button
            variant="outline"
            className="justify-start gap-2"
            disabled={!hasCover}
            title={hasCover ? undefined : 'Generate a cover letter first'}
            onClick={() => setPreview('cover')}
          >
            <Eye className="h-4 w-4" /> Preview Cover Letter{design ? ` (${design.name})` : ''}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {(['resume-pdf', 'resume-docx', 'cover-pdf', 'cover-docx'] as const).map((format) => {
            const ready = FORMAT_META[format].needs === 'resume' ? hasResume : hasCover;
            return (
              <Button
                key={format}
                variant="outline"
                className="justify-start gap-2"
                disabled={!ready || pending === format}
                title={ready ? undefined : `${FORMAT_META[format].needs === 'resume' ? 'Generate a tailored resume' : 'Generate a cover letter'} first`}
                onClick={() => download(format)}
              >
                {pending === format ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {FORMAT_META[format].label}
              </Button>
            );
          })}
        </div>
        <Button
          className="w-full gap-2"
          disabled={(!hasResume && !hasCover) || pending === 'package'}
          title={hasResume || hasCover ? undefined : 'Generate a resume or cover letter first'}
          onClick={() => download('package')}
        >
          {pending === 'package' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {pending === 'package' ? 'Preparing package...' : 'Download Application Package'}
        </Button>
      </CardContent>

      <Dialog open={preview !== null} onClose={() => setPreview(null)} className="max-w-3xl">
        <h3 className="mb-4 text-sm font-semibold">
          {preview === 'resume' ? 'Resume preview' : 'Cover letter preview'}{design ? ` -- ${design.name} design` : ''}
        </h3>
        {preview === 'resume' && draft && <ResumePreview profile={profile} draft={draft} design={design} />}
        {preview === 'cover' && letter && <CoverLetterPreview letter={letter} design={design} />}
      </Dialog>
    </Card>
  );
}
