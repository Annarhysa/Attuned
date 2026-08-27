'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devPreview, setDevPreview] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    setSent(true);
    if (data.devPreview) setDevPreview(data.devPreview);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>Enter your account email and we&apos;ll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3 text-sm">
              <p>If an account exists for {email}, a reset link has been sent.</p>
              {devPreview && (
                <div className="rounded-md bg-muted p-3">
                  <p className="mb-1 font-medium">No email server is configured, so here&apos;s your reset link directly:</p>
                  <Link href={devPreview.replace(/^https?:\/\/[^/]+/, '')} className="break-all text-primary underline">{devPreview}</Link>
                </div>
              )}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? 'Sending...' : 'Send reset link'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">Back to login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
