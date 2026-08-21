import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download } from 'lucide-react';

export function ExportPanel({ applicationId }: { applicationId: string }) {
  function download(format: string) {
    window.location.href = `/api/applications/${applicationId}/export?format=${format}`;
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Export</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Button variant="outline" className="justify-start gap-2" onClick={() => download('resume-pdf')}><Download className="h-4 w-4" /> Resume — PDF</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => download('resume-docx')}><Download className="h-4 w-4" /> Resume — DOCX</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => download('cover-pdf')}><Download className="h-4 w-4" /> Cover Letter — PDF</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => download('cover-docx')}><Download className="h-4 w-4" /> Cover Letter — DOCX</Button>
        </div>
        <Button className="w-full gap-2" onClick={() => download('package')}><Download className="h-4 w-4" /> Download Application Package</Button>
      </CardContent>
    </Card>
  );
}
