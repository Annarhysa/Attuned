'use client';

import { useEffect, useState } from 'react';
import { DesignTemplate } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { TemplatePreviewDialog } from './TemplateSample';

export function DesignSelector({
  applicationId,
  selected,
  onSelect,
}: {
  applicationId: string;
  selected: DesignTemplate | null;
  onSelect: (template: DesignTemplate & { id: string }) => void;
}) {
  const [templates, setTemplates] = useState<(DesignTemplate & { id: string })[]>([]);
  const [recommending, setRecommending] = useState(false);
  const [preview, setPreview] = useState<(DesignTemplate & { id: string }) | null>(null);

  useEffect(() => {
    fetch('/api/templates').then((r) => r.json()).then((data) => setTemplates(data.templates || []));
  }, []);

  async function handleRecommend() {
    setRecommending(true);
    const res = await fetch(`/api/applications/${applicationId}/design`, { method: 'POST' });
    setRecommending(false);
    if (res.ok) {
      const data = await res.json();
      onSelect(data.template);
      setTemplates((prev) => (prev.some((t) => t.id === data.template.id) ? prev : [...prev, data.template]));
    }
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" className="gap-2" disabled={recommending} onClick={handleRecommend}>
        <Sparkles className="h-4 w-4" /> {recommending ? 'Analyzing job...' : 'AI Recommended Design'}
      </Button>

      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className={selected?.name === t.name ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="cursor-pointer pb-2" onClick={() => setPreview(t)}>
              <div
                className="mb-3 h-20 rounded-md"
                style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.secondaryColor})` }}
              />
              <CardTitle className="text-sm">{t.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{t.font}</Badge>
                <Badge variant="outline">{t.layout}</Badge>
                {t.atsSafe && (
                  <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" /> ATS Safe</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setPreview(t)}>Preview</Button>
                <Button size="sm" className="flex-1" variant={selected?.name === t.name ? 'default' : 'outline'} onClick={() => onSelect(t)}>
                  {selected?.name === t.name ? 'Selected' : 'Use this design'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <TemplatePreviewDialog template={preview} open={!!preview} onClose={() => setPreview(null)} />
    </div>
  );
}
