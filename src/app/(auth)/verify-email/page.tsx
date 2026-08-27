'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MailCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    setNotice('');
    setError('');
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError('Could not resend the verification email.');
      return;
    }
    setNotice(data.devPreview ? `New link sent. Dev preview: ${data.devPreview}` : 'A new verification link has been sent to your email.');
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <MailCheck className="h-6 w-6 text-primary" />
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          We sent a verification link to {email || 'your email'}. Click it whenever you get a chance -- this is optional and won&apos;t block you from using Attuned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notice && <p className="break-all text-sm text-success">{notice}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleResend} disabled={resending} className="w-full gap-2">
          {resending && <Loader2 className="h-4 w-4 animate-spin" />} {resending ? 'Resending...' : 'Resend link'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary underline-offset-4 hover:underline">Back to dashboard</Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <Suspense fallback={null}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
