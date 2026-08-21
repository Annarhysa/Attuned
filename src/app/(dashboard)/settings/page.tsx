'use client';

import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { data: session } = useSession();

  async function handleDelete() {
    if (!confirm('Delete your account and all associated data? This cannot be undone.')) return;
    await fetch('/api/account', { method: 'DELETE' });
    signOut({ callbackUrl: '/' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>{session?.user?.email}</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Deleting your account permanently removes your profile, uploaded resumes, job data, and generated documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete}>Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
