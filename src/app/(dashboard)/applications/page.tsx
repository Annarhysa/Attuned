import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';
import { ApplicationCard } from '@/features/applications/ApplicationCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { safeJsonParse } from '@/lib/utils';
import { MatchAnalysis } from '@/types';
import { Plus } from 'lucide-react';

export default async function ApplicationsPage() {
  const userId = await requireUserId();
  const applications = await prisma.application.findMany({
    where: { userId },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">Every application workspace you&apos;ve created.</p>
        </div>
        <Link href="/applications/new"><Button className="gap-2"><Plus className="h-4 w-4" /> Create New Application</Button></Link>
      </div>

      {applications.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No applications yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <ApplicationCard
              key={app.id}
              id={app.id}
              company={app.job.company}
              role={app.job.title}
              status={app.status}
              createdAt={app.createdAt.toISOString()}
              matchScore={safeJsonParse<MatchAnalysis | null>(app.tailoredMatchAnalysis || app.matchAnalysis, null)?.overall_score}
            />
          ))}
        </div>
      )}
    </div>
  );
}
