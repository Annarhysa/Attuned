'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, scoreColorClass } from '@/lib/utils';
import { Copy, Trash2 } from 'lucide-react';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  saved: 'secondary',
  applied: 'default',
  interview: 'warning',
  offer: 'success',
  rejected: 'destructive',
};

export function ApplicationCard({
  id,
  company,
  role,
  status,
  createdAt,
  matchScore,
}: {
  id: string;
  company: string;
  role: string;
  status: string;
  createdAt: string;
  matchScore?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDuplicate() {
    setBusy(true);
    const res = await fetch(`/api/applications/${id}/duplicate`, { method: 'POST' });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/applications/${data.id}`);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete the application for ${role} at ${company}? This cannot be undone.`)) return;
    setBusy(true);
    await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    setBusy(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{company || 'Unknown Company'}</CardTitle>
            <p className="text-sm text-muted-foreground">{role || 'Untitled Role'}</p>
          </div>
          <Badge variant={STATUS_VARIANT[status] || 'secondary'}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Generated {formatDate(createdAt)}</span>
          {typeof matchScore === 'number' && (
            <span className={`font-semibold ${scoreColorClass(matchScore)}`}>{matchScore}%</span>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Link href={`/applications/${id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">Open</Button>
          </Link>
          <Button size="icon" variant="ghost" disabled={busy} onClick={handleDuplicate} title="Duplicate">
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" disabled={busy} onClick={handleDelete} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
