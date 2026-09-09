'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, Gift, Loader2 } from 'lucide-react';

interface ReferralInfo {
  referralCode: string;
  referralUnlocked: boolean;
  referralCount: number;
}

export function ReferralCard() {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/billing').then((r) => r.json()).then(setInfo);
  }, []);

  if (!info) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading referral link...
        </CardContent>
      </Card>
    );
  }

  const link = `${window.location.origin}/register?ref=${info.referralCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable -- the input is still selectable/copyable by hand
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gift className="h-4 w-4" /> Refer a friend</CardTitle>
        <CardDescription>
          When someone creates an account through your link, you unlock the yearly plan at €30/year — for life.
          {info.referralUnlocked && <Badge variant="success" className="ml-2">Unlocked</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Input readOnly value={link} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
          <Button type="button" variant="outline" size="icon" onClick={copyLink} aria-label="Copy referral link">
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {info.referralCount} {info.referralCount === 1 ? 'person has' : 'people have'} signed up through your link.
        </p>
      </CardContent>
    </Card>
  );
}
