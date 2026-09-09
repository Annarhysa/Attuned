'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MatchScore } from '@/features/match-analysis/MatchScore';
import { KeywordMap } from '@/features/match-analysis/KeywordMap';
import { GenerationPanel } from '@/features/document-editor/GenerationPanel';
import { DocumentEditor } from '@/features/document-editor/DocumentEditor';
import { DesignSelector } from '@/features/design-engine/DesignSelector';
import { ATSAnalyzerPanel } from '@/features/ats-analyzer/ATSAnalyzerPanel';
import { ExportPanel } from '@/features/document-editor/ExportPanel';
import { FirstVisitTour } from '@/features/document-editor/FirstVisitTour';
import { safeJsonParse } from '@/lib/utils';
import { CandidateProfile, CoverLetterDraft, DesignTemplate, GenerationOptions, JobAnalysis, MatchAnalysis, TailoredResumeDraft } from '@/types';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface ApplicationData {
  id: string;
  status: string;
  matchAnalysis: string | null;
  tailoredMatchAnalysis: string | null;
  designTemplate: (DesignTemplate & { id: string }) | null;
  job: { title: string; company: string; location: string; analysis: unknown };
  documents: { id: string; type: string; content: string }[];
}

const MATCH_THRESHOLD = 50;

const TAB_ORDER: { key: string; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'match', label: 'Match Analysis' },
  { key: 'keywords', label: 'Keyword Map' },
  { key: 'generate', label: 'Generate' },
  { key: 'editor', label: 'Editor' },
  { key: 'design', label: 'Design' },
  { key: 'ats', label: 'ATS Check' },
  { key: 'export', label: 'Export' },
];

function TabFooterNav({ current, onNavigate }: { current: string; onNavigate: (tab: string) => void }) {
  const idx = TAB_ORDER.findIndex((t) => t.key === current);
  const prev = idx > 0 ? TAB_ORDER[idx - 1] : null;
  const next = idx < TAB_ORDER.length - 1 ? TAB_ORDER[idx + 1] : null;
  return (
    // Lives at the top of the tab content, right under the tab list -- always
    // visible on landing, no scrolling (up or down) required to find it.
    // Plain row (no card/border) with equal spacing above (from the tab list)
    // and below (to the tab content), matched to the tab list's own height.
    <div className="my-3 flex items-center justify-between">
      {prev ? (
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => onNavigate(prev.key)}>
          <ArrowLeft className="h-3.5 w-3.5" /> {prev.label}
        </Button>
      ) : <span />}
      {next ? (
        <Button size="sm" className="gap-1.5" onClick={() => onNavigate(next.key)}>
          {next.label} <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ) : <span />}
    </div>
  );
}

function ApplicationWorkspaceContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const searchParams = useSearchParams();

  const [app, setApp] = useState<ApplicationData | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [match, setMatch] = useState<MatchAnalysis | null>(null);
  const [tailoredMatch, setTailoredMatch] = useState<MatchAnalysis | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<TailoredResumeDraft | null>(null);
  const [letter, setLetter] = useState<CoverLetterDraft | null>(null);
  const [tab, setTab] = useState(() => {
    const requested = searchParams.get('tab');
    return requested && TAB_ORDER.some((t) => t.key === requested) ? requested : 'overview';
  });
  const [genSelection, setGenSelection] = useState<{ resume: boolean; coverLetter: boolean }>({ resume: true, coverLetter: true });

  function goToGenerate(selection: { resume: boolean; coverLetter: boolean }) {
    setGenSelection(selection);
    setTab('generate');
  }

  const load = useCallback(async () => {
    const res = await fetch(`/api/applications/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setApp(data.application);
    setMatch(safeJsonParse<MatchAnalysis | null>(data.application.matchAnalysis, null));
    setTailoredMatch(safeJsonParse<MatchAnalysis | null>(data.application.tailoredMatchAnalysis, null));
    const resumeDoc = data.application.documents.find((d: { type: string }) => d.type === 'resume_tailored');
    const coverDoc = data.application.documents.find((d: { type: string }) => d.type === 'cover_letter');
    if (resumeDoc) setDraft(safeJsonParse<TailoredResumeDraft | null>(resumeDoc.content, null));
    if (coverDoc) setLetter(safeJsonParse<CoverLetterDraft | null>(coverDoc.content, null));
  }, [id]);

  useEffect(() => {
    load();
    fetch('/api/profile').then((r) => r.json()).then((data) => setProfile(data.profile));
  }, [load]);

  const runMatch = useCallback(async () => {
    setLoadingMatch(true);
    const res = await fetch(`/api/applications/${id}/match`, { method: 'POST' });
    setLoadingMatch(false);
    if (res.ok) {
      const data = await res.json();
      setMatch(data.match);
      setJobAnalysis(data.job);
    }
  }, [id]);

  useEffect(() => {
    if (app && !match) runMatch();
  }, [app, match, runMatch]);

  async function handleGenerate(options: GenerationOptions, generate: { resume: boolean; coverLetter: boolean }) {
    setGenerating(true);
    const res = await fetch(`/api/applications/${id}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options, generate }),
    });
    setGenerating(false);
    if (res.ok) {
      await load();
      setTab('editor');
    }
  }

  async function saveDocument(type: string, content: unknown) {
    const doc = app?.documents.find((d) => d.type === type);
    if (!doc) return;
    const res = await fetch(`/api/applications/${id}/documents/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = await res.json();
      const parsed = safeJsonParse(data.document.content, content);
      if (type === 'resume_tailored') setDraft(parsed as TailoredResumeDraft);
      if (type === 'cover_letter') setLetter(parsed as CoverLetterDraft);
    }
  }

  async function handleSelectDesign(template: DesignTemplate & { id: string }) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designTemplateId: template.id }),
    });
    setApp((a) => (a ? { ...a, designTemplate: template } : a));
  }

  if (!app) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading application...
      </div>
    );
  }

  const effectiveMatch = tailoredMatch || match;
  const suitable = (effectiveMatch?.overall_score ?? 0) >= MATCH_THRESHOLD;

  return (
    <div className="space-y-6">
      <FirstVisitTour currentTab={tab} onNavigateTab={setTab} />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{app.job.title} — {app.job.company}</h1>
          <p className="text-sm text-muted-foreground">{app.job.location}</p>
        </div>
        <Badge>{app.status}</Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TAB_ORDER.map((t) => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
        </TabsList>
        <TabFooterNav current={tab} onNavigate={setTab} />

        <TabsContent value="overview" className="mt-6 space-y-4">
          {loadingMatch && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your match against this job...
            </p>
          )}
          {effectiveMatch && (
            <Card data-tour="match-score">
              <CardContent className="space-y-4 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resume Match</p>
                    <p className="text-4xl font-bold">{effectiveMatch.overall_score}%</p>
                  </div>
                  {tailoredMatch && match && (
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Original: {match.overall_score}%</p>
                      <p className="font-medium text-success">Tailored: {tailoredMatch.overall_score}% ({tailoredMatch.overall_score - match.overall_score >= 0 ? '+' : ''}{tailoredMatch.overall_score - match.overall_score} pts)</p>
                    </div>
                  )}
                </div>

                {suitable ? (
                  <div className="rounded-md bg-success/10 p-4" data-tour="generate-buttons">
                    <p className="font-medium text-success">Your resume is a suitable match for this position.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={() => goToGenerate({ resume: true, coverLetter: false })}>Generate Tailored Resume</Button>
                      <Button variant="outline" onClick={() => goToGenerate({ resume: false, coverLetter: true })}>Generate Cover Letter</Button>
                      <Button variant="outline" onClick={() => goToGenerate({ resume: true, coverLetter: true })}>Generate Both</Button>
                      <Button variant="ghost" onClick={() => setTab('match')}>View Match Analysis</Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-warning/10 p-4">
                    <p className="font-medium text-warning">Your current resume has a low match with this position.</p>
                    <p className="mt-1 text-sm text-muted-foreground">Review the gaps below before generating a tailored resume.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setTab('match')}>View Gaps & Recommendations</Button>
                      <a href="/profile"><Button variant="ghost">Improve My Resume</Button></a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="match" className="mt-6">
          {effectiveMatch ? (
            <MatchScore match={effectiveMatch} title={tailoredMatch ? 'Tailored Resume Match' : 'Resume Match Score'} />
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Running match analysis...</p>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="mt-6">
          {effectiveMatch ? (
            <KeywordMap match={effectiveMatch} onGenerate={() => goToGenerate({ resume: true, coverLetter: true })} />
          ) : (
            <p className="text-sm text-muted-foreground">Run match analysis first.</p>
          )}
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <GenerationPanel key={`${genSelection.resume}-${genSelection.coverLetter}`} onGenerate={handleGenerate} generating={generating} initialSelection={genSelection} />
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          {profile ? (
            <DocumentEditor
              applicationId={id}
              profile={profile}
              draft={draft}
              letter={letter}
              design={app.designTemplate}
              onSaveDraft={(d) => saveDocument('resume_tailored', d)}
              onSaveLetter={(l) => saveDocument('cover_letter', l)}
            />
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your profile...</p>
          )}
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <DesignSelector applicationId={id} selected={app.designTemplate} onSelect={handleSelectDesign} />
        </TabsContent>

        <TabsContent value="ats" className="mt-6">
          <ATSAnalyzerPanel applicationId={id} />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          {profile ? (
            <ExportPanel applicationId={id} profile={profile} draft={draft} letter={letter} design={app.designTemplate} />
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your profile...</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ApplicationWorkspacePage() {
  return (
    <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
      <ApplicationWorkspaceContent />
    </Suspense>
  );
}
