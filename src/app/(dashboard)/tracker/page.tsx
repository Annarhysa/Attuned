'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';

interface TrackedApp {
  id: string;
  status: string;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
  job: { title: string; company: string };
}

const STATUSES = ['saved', 'applied', 'interview', 'rejected', 'offer'];

export default function TrackerPage() {
  const [apps, setApps] = useState<TrackedApp[]>([]);

  useEffect(() => {
    fetch('/api/applications/list')
      .then((r) => r.json())
      .then((data) => setApps(data.applications || []));
  }, []);

  async function update(id: string, patch: Partial<TrackedApp>) {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Job Tracker</h1>
        <p className="text-sm text-muted-foreground">Track status, notes, and follow-ups for every application.</p>
      </div>

      <div className="space-y-3">
        {apps.map((app) => (
          <Card key={app.id}>
            <CardContent className="grid gap-3 py-4 md:grid-cols-[1fr_140px_1fr_160px]">
              <div>
                <p className="font-medium">{app.job.company}</p>
                <p className="text-sm text-muted-foreground">{app.job.title} · {formatDate(app.createdAt)}</p>
              </div>
              <Select value={app.status} onChange={(e) => update(app.id, { status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
              </Select>
              <Input placeholder="Notes" value={app.notes} onChange={(e) => update(app.id, { notes: e.target.value })} />
              <Input type="date" value={app.followUpDate ? app.followUpDate.slice(0, 10) : ''} onChange={(e) => update(app.id, { followUpDate: e.target.value })} />
            </CardContent>
          </Card>
        ))}
        {apps.length === 0 && <p className="text-sm text-muted-foreground">No applications to track yet.</p>}
      </div>
    </div>
  );
}
