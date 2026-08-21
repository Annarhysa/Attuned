import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle2, FileText, Gauge, Palette, Sparkles, Target, XCircle } from 'lucide-react';

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

export default function LandingPage() {
  return (
    <main>
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Attuned</span>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link href="/register"><Button size="sm">Create My Application</Button></Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-secondary/40">
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
      </section>

      <section id="how-it-works" className="container py-20">
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
      </section>

      <section className="border-y border-border bg-secondary/40">
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
      </section>

      <section className="container py-20">
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
      </section>

      <section className="border-y border-border bg-secondary/40">
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
      </section>

      <section id="pricing" className="container py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight">Pricing</h2>
        <p className="mt-2 text-center text-muted-foreground">Simple plans — full pricing coming soon.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { name: 'Free', price: '$0', desc: 'Try the full flow', features: ['1 application', 'Match analysis', 'PDF export'] },
            { name: 'Pro', price: '$19/mo', desc: 'For active job seekers', features: ['Unlimited applications', 'All document types', 'DOCX + PDF export', 'Application tracker'] },
            { name: 'Career Coach', price: 'Contact us', desc: 'For coaches & teams', features: ['Multi-client workspaces', 'Custom templates', 'Priority support'] },
          ].map((plan) => (
            <Card key={plan.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.desc}</CardDescription>
                <p className="pt-2 text-2xl font-semibold">{plan.price}</p>
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
      </section>

      <section id="faq" className="border-t border-border bg-secondary/40">
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

      <footer className="border-t border-border py-10">
        <div className="container flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium text-foreground"><FileText className="h-4 w-4" /> Attuned</div>
          <p>Make every application more relevant.</p>
        </div>
      </footer>
    </main>
  );
}
