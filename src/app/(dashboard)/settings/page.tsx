'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_VERSION } from '@/components/legal-page';
import { BillingCard } from '@/features/billing/BillingCard';
import { ReferralCard } from '@/features/billing/ReferralCard';

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

      <BillingCard />
      <ReferralCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Deleting your account permanently removes your profile, uploaded resumes, job data, and generated documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDelete}>Delete Account</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>Attuned {APP_VERSION} · © {new Date().getFullYear()} Annarhysa Albert · MIT Licensed</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/about" className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">About Us</Link>
          <Link href="/privacy" className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">Privacy Policy</Link>
          <Link href="/cookies" className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">Cookie Policy</Link>
          <Link href="/license" className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">License</Link>
        </CardContent>
      </Card>
    </div>
  );
}
