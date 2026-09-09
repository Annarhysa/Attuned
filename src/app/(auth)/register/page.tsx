'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gift, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  // Read straight from the URL instead of useSearchParams so this page
  // doesn't need a Suspense boundary just for an optional referral code.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) setReferralCode(ref);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, referralCode: referralCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Something went wrong.');
      return;
    }

    // Auto-login right after signup -- email verification is a link sent in
    // the background (see devPreview below) and never blocks access.
    const signInRes = await signIn('credentials', { email, password, remember: 'true', redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push('/login');
      return;
    }
    const preview = data.devPreview ? `&preview=${encodeURIComponent(data.devPreview)}` : '';
    router.push(`/onboarding?justRegistered=true${preview}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start building tailored applications in minutes.</CardDescription>
        </CardHeader>
        <CardContent>
          {referralCode && (
            <p className="mb-4 flex items-center gap-1.5 rounded-md bg-success/10 px-3 py-2 text-xs font-medium text-success">
              <Gift className="h-3.5 w-3.5" /> Referred by a friend -- they'll unlock a discount once you sign up.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} {loading ? 'Creating account...' : 'Create My Application'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary underline-offset-4 hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
