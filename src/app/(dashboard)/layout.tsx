import Link from 'next/link';
import { MailWarning } from 'lucide-react';
import { requireUserId, requireOnboarded } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  await requireOnboarded(userId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        {user && !user.emailVerified && (
          <div className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-sm text-warning">
            <MailWarning className="h-4 w-4" />
            Your email isn&apos;t verified yet.
            <Link href={`/verify-email?email=${encodeURIComponent(user.email)}`} className="font-medium underline underline-offset-2">
              Verify now
            </Link>
          </div>
        )}
        <div className="container max-w-6xl py-8">{children}</div>
      </div>
    </div>
  );
}
