import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripe, priceIdForPlan, isPlan } from '@/lib/stripe';

export async function POST(req: Request) {
  const userId = await requireUserId();
  const { plan } = await req.json();
  if (!isPlan(plan)) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (plan === 'yearly_referral' && !user.referralUnlocked) {
    return NextResponse.json({ error: 'Refer a friend first to unlock this rate.' }, { status: 403 });
  }

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId } });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId } });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    success_url: `${baseUrl}/settings?billing=success`,
    cancel_url: `${baseUrl}/settings?billing=cancelled`,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
  });

  return NextResponse.json({ url: session.url });
}
