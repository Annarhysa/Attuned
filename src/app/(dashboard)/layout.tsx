import { requireUserId } from '@/lib/session';
import { Sidebar } from '@/components/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireUserId();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="container max-w-6xl py-8">{children}</div>
      </div>
    </div>
  );
}
