import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ApplicationCard } from '@/features/applications/ApplicationCard';
import { safeJsonParse } from '@/lib/utils';
import { MatchAnalysis } from '@/types';
import { Plus } from 'lucide-react';

export default async function DashboardPage() {
  const userId = await requireUserId();
  const applications = await prisma.application.findMany({
    where: { userId },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
  });

  const scores = applications
    .map((a) => safeJsonParse<MatchAnalysis | null>(a.tailoredMatchAnalysis || a.matchAnalysis, null)?.overall_score)
    .filter((s): s is number => typeof s === 'number');
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const now = new Date();
  const thisMonth = applications.filter((a) => a.createdAt.getMonth() === now.getMonth() && a.createdAt.getFullYear() === now.getFullYear()).length;
  const interviewed = applications.filter((a) => ['interview', 'offer'].includes(a.status)).length;
  const applied = applications.filter((a) => a.status !== 'saved').length;
  const interviewRate = applied ? Math.round((interviewed / applied) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your applications and match performance.</p>
        </div>
        <Link href="/applications/new"><Button className="gap-2"><Plus className="h-4 w-4" /> Create New Application</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Applications', value: applications.length },
          { label: 'Average Match Score', value: `${avgScore}%` },
          { label: 'Applications This Month', value: thisMonth },
          { label: 'Interview Rate', value: `${interviewRate}%` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Applications</h2>
        {applications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-muted-foreground">You haven&apos;t created an application yet.</p>
              <Link href="/applications/new"><Button>Create your first application</Button></Link>
            </CardContent>
          </Card>
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
    </div>
  );
}
