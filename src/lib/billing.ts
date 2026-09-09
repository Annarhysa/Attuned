import { prisma } from '@/lib/prisma';

/** Free trial: applications a user can create before a subscription is required. */
export const FREE_APPLICATION_LIMIT = 1;

const ACTIVE_STATUSES = ['active', 'trialing'];

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return !!user?.isAdmin;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  if (await isAdmin(userId)) return true;
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  return !!sub && ACTIVE_STATUSES.includes(sub.status);
}

export async function canCreateApplication(userId: string): Promise<boolean> {
  if (await hasActiveSubscription(userId)) return true;
  const count = await prisma.application.count({ where: { userId } });
  return count < FREE_APPLICATION_LIMIT;
}
