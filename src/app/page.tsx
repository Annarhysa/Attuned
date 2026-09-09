import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { APP_VERSION } from '@/components/legal-page';
import { ArrowRight, CheckCircle2, ChevronDown, FileStack, Gauge, Gift, Palette, Sparkles, Target, XCircle } from 'lucide-react';

const HOW_IT_WORKS = [
  { title: 'Paste the job description', desc: 'Or upload it, or just drop in keywords. We analyze the role, company signals, and tone.' },
  { title: 'Bring your real resume', desc: 'Upload or paste your resume once. We extract a structured profile you can verify and reuse.' },
  { title: 'See exactly where you fit', desc: 'A match score with evidence for every requirement — and honesty about the gaps.' },
  { title: 'Get a tailored, ATS-ready package', desc: 'A resume and cover letter built around this specific role, ready to edit and export.' },
];

const WHY_GENERIC_FAILS = [
  'Same resume sent to every company, regardless of role or industry',
  'Keyword-stuffed instead of evidence-backed',
  'Generic buzzwords that ATS systems and hiring managers both ignore',
  "Cover letters that just repeat the resume",
];

const FAQ = [
  { q: 'Will this fabricate experience I don\'t have?', a: 'No. The AI only ever uses information already in your candidate profile. Anything a job asks for that you don\'t have is flagged as a gap, never invented.' },
  { q: 'Do I need an OpenAI or Anthropic API key?', a: 'No — a fully local analysis engine ships by default. You can optionally connect a real model provider later for richer generation.' },
  { q: 'Is the output ATS-safe?', a: 'Every template is checked for ATS-safe formatting, and you get a live ATS score before you export.' },
  { q: 'Can I edit what the AI generates?', a: 'Yes — every section goes through a live editor where you can accept, reject, or hand-edit each change.' },
];

function ScrollHint({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      aria-label="Scroll to next section"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronDown className="h-6 w-6" />
    </a>
  );
}

export default function LandingPage() {
  return (
    <main className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container grid h-16 grid-cols-[1fr_auto_1fr] items-center">
          <span className="flex items-center gap-2 justify-self-start text-lg font-semibold tracking-tight">
            <FileStack className="h-5 w-5 text-primary" /> Attuned
          </span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center justify-end gap-2 justify-self-end">
            <ThemeToggle />
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm">Create My Application</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative snap-start flex min-h-[calc(100vh-4rem)] flex-col justify-center border-b border-border bg-secondary/40">
        <div className="container flex flex-col items-center gap-6 py-24 text-center">
          <Badge variant="outline" className="gap-1.5"><Sparkles className="h-3 w-3" /> Evidence-based, not generic AI</Badge>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight">Your application. Tailored for the job.</h1>
          <p className="max-w-xl text-balance text-lg text-muted-foreground">
            Turn any job description into a targeted resume and cover letter designed around the role, company, and industry.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/register"><Button size="lg" className="gap-2">Create My Application <ArrowRight className="h-4 w-4" /></Button></Link>
            <a href="#how-it-works"><Button size="lg" variant="outline">See How It Works</Button></a>
          </div>
        </div>
        <ScrollHint targetId="how-it-works" />
      </section>

      <section id="how-it-works" className="relative snap-start flex min-h-[calc(100vh-4rem)] scroll-mt-16 flex-col justify-center">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">How it works</h2>
          <p className="mt-2 text-center text-muted-foreground">From job posting to submit-ready application in four steps.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <Card key={step.title}>
                <CardHeader>
                  <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                  <CardTitle className="text-base">{step.title}</CardTitle>
                  <CardDescription>{step.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        <ScrollHint targetId="why-generic-fails" />
      </section>

      <section id="why-generic-fails" className="relative snap-start flex min-h-[calc(100vh-4rem)] scroll-mt-16 flex-col justify-center border-y border-border bg-secondary/40">
        <div className="container grid gap-12 py-20 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Why generic resumes fail</h2>
            <ul className="mt-6 space-y-3">
              {WHY_GENERIC_FAILS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">What Attuned does instead</h2>
            <ul className="mt-6 space-y-3">
              {[
                'Analyzes the specific job — industry, seniority, tone, terminology',
                'Matches your real experience against every requirement, with evidence',
                'Only ever uses what\'s actually in your profile — no fabricated skills or metrics',
                'Generates documents that explain why you fit, not just what you\'ve done',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <ScrollHint targetId="features" />
      </section>

      <section id="features" className="relative snap-start flex min-h-[calc(100vh-4rem)] scroll-mt-16 flex-col justify-center">
        <div className="container py-20">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Target className="h-6 w-6 text-primary" />
                <CardTitle>AI-Powered Tailoring</CardTitle>
                <CardDescription>Every requirement in the job description is matched against real evidence in your profile — skills, projects, and experience.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Palette className="h-6 w-6 text-primary" />
                <CardTitle>Industry-Specific Optimization</CardTitle>
                <CardDescription>Terminology, tone, and visual design adapt to the role's industry — fintech, AI startup, healthcare, and more.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Gauge className="h-6 w-6 text-primary" />
                <CardTitle>ATS-Friendly Documents</CardTitle>
                <CardDescription>Every design is checked against ATS-safe formatting rules, with a live keyword coverage score.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
        <ScrollHint targetId="before-after" />
      </section>

      <section id="before-after" className="relative snap-start flex min-h-[calc(100vh-4rem)] scroll-mt-16 flex-col justify-center border-y border-border bg-secondary/40">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Before / After</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Before</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="rounded-md bg-muted p-3">&quot;Built backend workflows.&quot;</p>
                <p className="text-muted-foreground">Generic, no evidence, no keyword alignment. Match score: <span className="font-semibold text-destructive">41%</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">After</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="rounded-md bg-muted p-3">&quot;Built scalable backend workflows integrating WordPress with serverless AWS functions.&quot;</p>
                <p className="text-muted-foreground">Same true fact, phrased with the JD&apos;s own language. Match score: <span className="font-semibold text-success">89%</span></p>
              </CardContent>
            </Card>
          </div>
        </div>
        <ScrollHint targetId="pricing" />
      </section>

      <section id="pricing" className="relative snap-start flex min-h-[calc(100vh-4rem)] scroll-mt-16 flex-col justify-center">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-2 text-center text-muted-foreground">Try it free, then a simple membership.</p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 md:grid-cols-2">
            {[
              { name: 'Free Trial', price: '€0', desc: 'No credit card required', features: ['1 application', 'Full match analysis', 'PDF & DOCX export'] },
              { name: 'Membership', price: '€5/mo', sub: 'or €50/yr', desc: 'For active job seekers', features: ['Unlimited applications', 'All document types', 'DOCX + PDF export', 'Application tracker'], highlight: true },
            ].map((plan) => (
              <Card key={plan.name} className={`flex flex-col ${plan.highlight ? 'border-primary' : ''}`}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.desc}</CardDescription>
                  <p className="pt-2 text-2xl font-semibold">
                    {plan.price} {plan.sub && <span className="text-sm font-normal text-muted-foreground">{plan.sub}</span>}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> {f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-1.5 text-center text-sm text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" /> Refer a friend who creates an account and unlock the yearly plan at <span className="font-medium text-foreground">€30/year</span> — for life.
          </p>
        </div>
        <ScrollHint targetId="faq" />
      </section>

      <section id="faq" className="snap-start flex min-h-[calc(100vh-4rem)] scroll-mt-16 flex-col justify-center border-t border-border bg-secondary/40">
        <div className="container py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-medium">{item.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="snap-end border-t border-border py-4">
        <div className="container flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-1.5">
            <FileStack className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">Attuned</span>
            <span>{APP_VERSION} · © {new Date().getFullYear()} Annarhysa Albert · MIT Licensed</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-3">
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/cookies" className="hover:text-foreground">Cookies</Link>
            <Link href="/license" className="hover:text-foreground">License</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
