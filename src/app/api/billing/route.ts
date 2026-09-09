import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { FREE_APPLICATION_LIMIT, hasActiveSubscription } from '@/lib/billing';

export async function GET() {
  const userId = await requireUserId();

  const [user, subscription, applicationCount, referralCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true, referralUnlocked: true, isAdmin: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.application.count({ where: { userId } }),
    prisma.user.count({ where: { referredById: userId } }),
  ]);

  return NextResponse.json({
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    active: await hasActiveSubscription(userId),
    isAdmin: !!user?.isAdmin,
    applicationsUsed: applicationCount,
    freeApplicationLimit: FREE_APPLICATION_LIMIT,
    referralCode: user?.referralCode,
    referralUnlocked: !!user?.referralUnlocked,
    referralCount,
  });
}
