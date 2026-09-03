import { prisma } from '@/lib/prisma';
import { DesignTemplate } from '@/types';
import { TemplatesGrid } from '@/features/design-engine/TemplatesGrid';

export default async function TemplatesPage() {
  const templates = (await prisma.designTemplate.findMany({ orderBy: { industry: 'asc' } })) as (DesignTemplate & { id: string })[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-sm text-muted-foreground">Design templates the engine chooses from, based on industry, role, and tone. Click one to see a sample.</p>
      </div>
      <TemplatesGrid templates={templates} />
    </div>
  );
}
