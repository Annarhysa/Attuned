'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
import { safeJsonParse } from '@/lib/utils';
import { CoverLetterDraft, DesignTemplate, GenerationOptions, JobAnalysis, MatchAnalysis, TailoredResumeDraft } from '@/types';

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

export default function ApplicationWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [app, setApp] = useState<ApplicationData | null>(null);
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [match, setMatch] = useState<MatchAnalysis | null>(null);
  const [tailoredMatch, setTailoredMatch] = useState<MatchAnalysis | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<TailoredResumeDraft | null>(null);
  const [letter, setLetter] = useState<CoverLetterDraft | null>(null);
  const [tab, setTab] = useState('overview');

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

  useEffect(() => { load(); }, [load]);

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
    await fetch(`/api/applications/${id}/documents/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  }

  async function handleSelectDesign(template: DesignTemplate & { id: string }) {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ designTemplateId: template.id }),
    });
    setApp((a) => (a ? { ...a, designTemplate: template } : a));
  }

  if (!app) return <p className="text-sm text-muted-foreground">Loading application...</p>;

  const effectiveMatch = tailoredMatch || match;
  const suitable = (effectiveMatch?.overall_score ?? 0) >= MATCH_THRESHOLD;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{app.job.title} — {app.job.company}</h1>
          <p className="text-sm text-muted-foreground">{app.job.location}</p>
        </div>
        <Badge>{app.status}</Badge>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="match">Match Analysis</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Map</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="ats">ATS Check</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          {loadingMatch && <p className="text-sm text-muted-foreground">Analyzing your match against this job...</p>}
          {effectiveMatch && (
            <Card>
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
                  <div className="rounded-md bg-success/10 p-4">
                    <p className="font-medium text-success">Your resume is a suitable match for this position.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button onClick={() => setTab('generate')}>Generate Tailored Resume</Button>
                      <Button variant="outline" onClick={() => setTab('generate')}>Generate Cover Letter</Button>
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
          {effectiveMatch ? <MatchScore match={effectiveMatch} title={tailoredMatch ? 'Tailored Resume Match' : 'Resume Match Score'} /> : <p className="text-sm text-muted-foreground">Running match analysis...</p>}
        </TabsContent>

        <TabsContent value="keywords" className="mt-6">
          {effectiveMatch ? <KeywordMap match={effectiveMatch} /> : <p className="text-sm text-muted-foreground">Run match analysis first.</p>}
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <GenerationPanel onGenerate={handleGenerate} generating={generating} />
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          <DocumentEditor
            applicationId={id}
            draft={draft}
            letter={letter}
            onChangeDraft={(d) => { setDraft(d); saveDocument('resume_tailored', d); }}
            onChangeLetter={(l) => { setLetter(l); saveDocument('cover_letter', l); }}
          />
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <DesignSelector applicationId={id} selected={app.designTemplate} onSelect={handleSelectDesign} />
        </TabsContent>

        <TabsContent value="ats" className="mt-6">
          <ATSAnalyzerPanel applicationId={id} />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <ExportPanel applicationId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
