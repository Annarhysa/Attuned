import { JobAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function Chips({ items, variant }: { items: string[]; variant?: 'default' | 'secondary' | 'outline' }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">None detected.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => <Badge key={item} variant={variant || 'secondary'}>{item}</Badge>)}
    </div>
  );
}

export function JobIntelligence({ analysis }: { analysis: JobAnalysis }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Job Overview</CardTitle></CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <Info label="Job Title" value={analysis.job_title} />
          <Info label="Company" value={analysis.company} />
          <Info label="Location" value={analysis.location || 'Not specified'} />
          <Info label="Employment Type" value={analysis.employment_type || 'Not specified'} />
          <Info label="Experience Level" value={analysis.seniority} />
          <Info label="Tone" value={analysis.tone} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Job Intelligence</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <Section label="Required Skills"><Chips items={analysis.required_skills} /></Section>
          <Section label="Preferred Skills"><Chips items={analysis.preferred_skills} variant="outline" /></Section>
          <Section label="Responsibilities">
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {analysis.responsibilities.length ? analysis.responsibilities.map((r) => <li key={r}>{r}</li>) : <li>None detected.</li>}
            </ul>
          </Section>
          <Section label="Keywords"><Chips items={analysis.keywords} /></Section>
          <Section label="Soft Skills"><Chips items={analysis.soft_skills} variant="outline" /></Section>
          <Section label="Technologies"><Chips items={analysis.technologies} /></Section>
          <Section label="Domain Terms"><Chips items={analysis.domain_terms} variant="outline" /></Section>
          <Section label="Important Phrases">
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {analysis.important_phrases.length ? analysis.important_phrases.map((p) => <li key={p}>{p}</li>) : <li>None detected.</li>}
            </ul>
          </Section>
          <Section label="Company Signals"><Chips items={analysis.company_signals} variant="outline" /></Section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Job Match Strategy</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{analysis.match_strategy}</p></CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}
