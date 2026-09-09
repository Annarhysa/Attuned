'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard } from 'lucide-react';
import { Plan, PLAN_LABELS } from '@/lib/plans';

interface BillingInfo {
  subscription: { plan: Plan; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
  active: boolean;
  isAdmin: boolean;
  applicationsUsed: number;
  freeApplicationLimit: number;
  referralUnlocked: boolean;
}

export function BillingCard() {
  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [pending, setPending] = useState<Plan | 'portal' | null>(null);
  const [error, setError] = useState('');

  function load() {
    fetch('/api/billing').then((r) => r.json()).then(setInfo);
  }

  useEffect(() => {
    load();
    // Coming back from a Stripe Checkout/portal redirect -- refresh once the
    // webhook has had a moment to land.
    if (new URLSearchParams(window.location.search).get('billing')) {
      const t = setTimeout(load, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  async function subscribe(plan: Plan) {
    setPending(plan);
    setError('');
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Could not start checkout.');
      setPending(null);
      return;
    }
    window.location.href = data.url;
  }

  async function manageBilling() {
    setPending('portal');
    setError('');
    const res = await fetch('/api/billing/portal', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || 'Could not open billing portal.');
      setPending(null);
      return;
    }
    window.location.href = data.url;
  }

  if (!info) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading billing...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Membership</CardTitle>
        <CardDescription>
          {info.isAdmin
            ? 'Admin account — unlimited access, billing rules don\'t apply'
            : info.active && info.subscription
            ? `${PLAN_LABELS[info.subscription.plan]} · ${info.subscription.status}${info.subscription.cancelAtPeriodEnd ? ' · cancels at period end' : ''}`
            : `Free trial — ${info.applicationsUsed} of ${info.freeApplicationLimit} application${info.freeApplicationLimit === 1 ? '' : 's'} used`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {info.isAdmin ? null : info.active ? (
          <Button variant="outline" disabled={pending === 'portal'} onClick={manageBilling} className="gap-2">
            {pending === 'portal' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Manage billing
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button disabled={!!pending} onClick={() => subscribe('monthly')} className="gap-2">
              {pending === 'monthly' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Monthly — €5/mo
            </Button>
            <Button variant="outline" disabled={!!pending} onClick={() => subscribe('yearly')} className="gap-2">
              {pending === 'yearly' && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Yearly — €50/yr
            </Button>
            {info.referralUnlocked && (
              <Button variant="outline" disabled={!!pending} onClick={() => subscribe('yearly_referral')} className="gap-2 border-success text-success hover:bg-success/10">
                {pending === 'yearly_referral' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Badge variant="success" className="mr-1">Unlocked</Badge> Yearly — €30/yr
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
