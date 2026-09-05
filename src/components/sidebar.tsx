'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, User, Briefcase, FileText, Mail, LayoutTemplate, ListChecks, Settings, LogOut, FileStack,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/applications', label: 'Applications', icon: Briefcase },
  { href: '/applications/new', label: 'Resume Builder', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/tracker', label: 'Job Tracker', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname() || '';

  // /applications is special-cased: the bare list page is "Applications",
  // but everything under it (/applications/new to start one, or
  // /applications/[id] to actually build/edit a resume) is where resume
  // building happens, so it should light up "Resume Builder" instead.
  let activeHref: string | undefined;
  if (pathname === '/applications') {
    activeHref = '/applications';
  } else if (pathname.startsWith('/applications/')) {
    activeHref = '/applications/new';
  } else {
    // Everything else: longest-prefix match among the remaining nav items.
    activeHref = NAV
      .filter((item) => item.href !== '/applications' && item.href !== '/applications/new')
      .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-secondary/30">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <FileStack className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">Attuned</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </aside>
  );
}
