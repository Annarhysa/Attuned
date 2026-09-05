'use client';

import { useState } from 'react';
import { DesignTemplate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';
import { TemplatePreviewDialog } from './TemplateSample';

export function TemplatesGrid({ templates }: { templates: (DesignTemplate & { id: string })[] }) {
  const [preview, setPreview] = useState<(DesignTemplate & { id: string }) | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setPreview(t)}>
            <CardHeader className="pb-2">
              <div className="mb-3 h-20 rounded-md" style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor})` }} />
              <CardTitle className="text-sm">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              <Badge variant="outline">{t.industry}</Badge>
              <Badge variant="outline">{t.font}</Badge>
              <Badge variant="outline">{t.layout}</Badge>
              {t.atsSafe && <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" /> ATS Safe</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
      <TemplatePreviewDialog template={preview} open={!!preview} onClose={() => setPreview(null)} />
    </>
  );
}
