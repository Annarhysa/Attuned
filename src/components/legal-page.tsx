import Link from 'next/link';
import { FileStack } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export const APP_VERSION = 'v1.0';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <FileStack className="h-5 w-5 text-primary" /> Attuned
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container max-w-3xl flex-1 py-16">
        <p className="text-sm text-muted-foreground">Last updated {updated} · Attuned {APP_VERSION}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">{children}</div>
      </main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">← Back to Attuned</Link>
      </footer>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}
