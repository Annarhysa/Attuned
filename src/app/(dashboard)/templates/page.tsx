import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

export default async function TemplatesPage() {
  const templates = await prisma.designTemplate.findMany({ orderBy: { industry: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">Design templates the engine chooses from, based on industry, role, and tone.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id}>
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
    </div>
  );
}
