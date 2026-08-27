'use client';

import { useEffect, useState } from 'react';
import { CandidateProfile, CoverLetterDraft, DesignTemplate, TailoredResumeDraft } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssistBar } from './AssistBar';
import { DiffView } from './DiffView';
import { ResumePreview, CoverLetterPreview } from './DocumentPreview';
import { Check, Loader2 } from 'lucide-react';

type Section =
  | { kind: 'summary' }
  | { kind: 'skills' }
  | { kind: 'experience'; idx: number }
  | { kind: 'project'; idx: number };

function SaveBar({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
      <Button size="sm" disabled={!dirty || saving} onClick={onSave} className="gap-2">
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {saving ? 'Saving...' : 'Save Changes'}
      </Button>
      <span className={`text-xs ${dirty ? 'text-warning' : 'text-muted-foreground'}`}>
        {saving ? 'Saving...' : dirty ? 'You have unsaved changes' : (
          <span className="flex items-center gap-1"><Check className="h-3 w-3 text-success" /> All changes saved</span>
        )}
      </span>
    </div>
  );
}

export function DocumentEditor({
  applicationId,
  profile,
  draft,
  letter,
  design,
  onSaveDraft,
  onSaveLetter,
}: {
  applicationId: string;
  profile: CandidateProfile;
  draft: TailoredResumeDraft | null;
  letter: CoverLetterDraft | null;
  design: (DesignTemplate & { id: string }) | null;
  onSaveDraft: (d: TailoredResumeDraft) => Promise<void>;
  onSaveLetter: (l: CoverLetterDraft) => Promise<void>;
}) {
  const [localDraft, setLocalDraft] = useState<TailoredResumeDraft | null>(draft);
  const [localLetter, setLocalLetter] = useState<CoverLetterDraft | null>(letter);
  const [draftDirty, setDraftDirty] = useState(false);
  const [letterDirty, setLetterDirty] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingLetter, setSavingLetter] = useState(false);
  const [section, setSection] = useState<Section>({ kind: 'summary' });
  const [showDiff, setShowDiff] = useState(true);

  // Resync local editing state when the parent hands us a new document object
  // -- initial load, or a fresh (re)generation. The parent does NOT create a
  // new object reference on every render, so in-progress local edits survive
  // unrelated re-renders and are only reset by an actual reload/regenerate.
  useEffect(() => {
    setLocalDraft(draft);
    setDraftDirty(false);
  }, [draft]);
  useEffect(() => {
    setLocalLetter(letter);
    setLetterDirty(false);
  }, [letter]);

  if (!localDraft && !localLetter) {
    return <p className="text-sm text-muted-foreground">Generate a document first to start editing.</p>;
  }

  async function handleSaveDraft() {
    if (!localDraft) return;
    setSavingDraft(true);
    await onSaveDraft(localDraft);
    setSavingDraft(false);
    setDraftDirty(false);
  }

  async function handleSaveLetter() {
    if (!localLetter) return;
    setSavingLetter(true);
    await onSaveLetter(localLetter);
    setSavingLetter(false);
    setLetterDirty(false);
  }

  const previewHighlight = section.kind === 'experience' ? 'experience' : section.kind === 'project' ? 'projects' : section.kind;

  return (
    <Tabs defaultValue={localDraft ? 'resume' : 'cover'}>
      <TabsList>
        {localDraft && <TabsTrigger value="resume">Resume</TabsTrigger>}
        {localLetter && <TabsTrigger value="cover">Cover Letter</TabsTrigger>}
      </TabsList>

      {localDraft && (
        <TabsContent value="resume" className="mt-4 space-y-4">
          <SaveBar dirty={draftDirty} saving={savingDraft} onSave={handleSaveDraft} />
          <div className="grid gap-4 lg:grid-cols-[160px_1fr_360px]">
            <nav className="space-y-1">
              <SectionButton active={section.kind === 'summary'} onClick={() => setSection({ kind: 'summary' })}>Summary</SectionButton>
              <SectionButton active={section.kind === 'skills'} onClick={() => setSection({ kind: 'skills' })}>Skills</SectionButton>
              {localDraft.experiences.map((e, i) => (
                <SectionButton key={i} active={section.kind === 'experience' && section.idx === i} onClick={() => setSection({ kind: 'experience', idx: i })}>
                  {e.entry.title || e.entry.company || `Experience ${i + 1}`}
                </SectionButton>
              ))}
              {localDraft.projects.map((p, i) => (
                <SectionButton key={i} active={section.kind === 'project' && section.idx === i} onClick={() => setSection({ kind: 'project', idx: i })}>
                  {p.entry.name || `Project ${i + 1}`}
                </SectionButton>
              ))}
            </nav>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live Preview</p>
                <button className="text-xs text-muted-foreground underline" onClick={() => setShowDiff((s) => !s)}>
                  {showDiff ? 'Hide changes' : 'Show changes'}
                </button>
              </div>
              <ResumePreview profile={profile} draft={localDraft} design={design} highlight={previewHighlight} />
            </div>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm capitalize">Edit: {section.kind}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {section.kind === 'summary' && (
                  <>
                    {showDiff && localDraft.summary.before !== localDraft.summary.after && (
                      <div className="rounded-md bg-muted p-2 text-xs"><DiffView before={localDraft.summary.before} after={localDraft.summary.after} /></div>
                    )}
                    <Textarea
                      rows={6}
                      value={localDraft.summary.after}
                      onChange={(e) => { setLocalDraft({ ...localDraft, summary: { ...localDraft.summary, after: e.target.value, changed: true } }); setDraftDirty(true); }}
                    />
                    <AssistBar
                      applicationId={applicationId}
                      text={localDraft.summary.after}
                      onApply={(t) => { setLocalDraft({ ...localDraft, summary: { ...localDraft.summary, after: t, changed: true } }); setDraftDirty(true); }}
                    />
                  </>
                )}

                {section.kind === 'skills' && (
                  <Input
                    value={localDraft.skills.after.join(', ')}
                    onChange={(e) => { setLocalDraft({ ...localDraft, skills: { ...localDraft.skills, after: e.target.value.split(',').map((s) => s.trim()).filter(Boolean), changed: true } }); setDraftDirty(true); }}
                  />
                )}

                {section.kind === 'experience' && localDraft.experiences[section.idx] && (
                  <div className="space-y-4">
                    {localDraft.experiences[section.idx].afterBullets.map((b, bi) => (
                      <div key={bi} className="space-y-1.5 border-b border-border pb-3 last:border-0">
                        {showDiff && localDraft.experiences[section.idx].beforeBullets[bi] && localDraft.experiences[section.idx].beforeBullets[bi] !== b && (
                          <div className="rounded-md bg-muted p-2 text-xs"><DiffView before={localDraft.experiences[section.idx].beforeBullets[bi]} after={b} /></div>
                        )}
                        <Textarea
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const next = [...localDraft.experiences];
                            const bullets = [...next[section.idx].afterBullets];
                            bullets[bi] = e.target.value;
                            next[section.idx] = { ...next[section.idx], afterBullets: bullets, changed: true };
                            setLocalDraft({ ...localDraft, experiences: next });
                            setDraftDirty(true);
                          }}
                        />
                        <AssistBar
                          compact
                          applicationId={applicationId}
                          text={b}
                          onApply={(t) => {
                            const next = [...localDraft.experiences];
                            const bullets = [...next[section.idx].afterBullets];
                            bullets[bi] = t;
                            next[section.idx] = { ...next[section.idx], afterBullets: bullets, changed: true };
                            setLocalDraft({ ...localDraft, experiences: next });
                            setDraftDirty(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {section.kind === 'project' && localDraft.projects[section.idx] && (
                  <div className="space-y-4">
                    {localDraft.projects[section.idx].afterBullets.map((b, bi) => (
                      <div key={bi} className="space-y-1.5 border-b border-border pb-3 last:border-0">
                        <Textarea
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const next = [...localDraft.projects];
                            const bullets = [...next[section.idx].afterBullets];
                            bullets[bi] = e.target.value;
                            next[section.idx] = { ...next[section.idx], afterBullets: bullets, changed: true };
                            setLocalDraft({ ...localDraft, projects: next });
                            setDraftDirty(true);
                          }}
                        />
                        <AssistBar
                          compact
                          applicationId={applicationId}
                          text={b}
                          onApply={(t) => {
                            const next = [...localDraft.projects];
                            const bullets = [...next[section.idx].afterBullets];
                            bullets[bi] = t;
                            next[section.idx] = { ...next[section.idx], afterBullets: bullets, changed: true };
                            setLocalDraft({ ...localDraft, projects: next });
                            setDraftDirty(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {localDraft.omittedKeywords.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Intentionally not added (no evidence in your profile): {localDraft.omittedKeywords.join(', ')}
            </p>
          )}
        </TabsContent>
      )}

      {localLetter && (
        <TabsContent value="cover" className="mt-4 space-y-4">
          <SaveBar dirty={letterDirty} saving={savingLetter} onSave={handleSaveLetter} />
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Live Preview</p>
              <CoverLetterPreview letter={localLetter} design={design} />
            </div>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Edit Cover Letter</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <EditableParagraph
                  label="Opening"
                  value={localLetter.opening}
                  applicationId={applicationId}
                  onChange={(v) => { setLocalLetter({ ...localLetter, opening: v }); setLetterDirty(true); }}
                />
                {localLetter.body.map((p, i) => (
                  <EditableParagraph
                    key={i}
                    label={`Body ${i + 1}`}
                    value={p}
                    applicationId={applicationId}
                    onChange={(v) => {
                      const body = [...localLetter.body];
                      body[i] = v;
                      setLocalLetter({ ...localLetter, body });
                      setLetterDirty(true);
                    }}
                  />
                ))}
                <EditableParagraph
                  label="Domain paragraph"
                  value={localLetter.domainParagraph}
                  applicationId={applicationId}
                  onChange={(v) => { setLocalLetter({ ...localLetter, domainParagraph: v }); setLetterDirty(true); }}
                />
                <EditableParagraph
                  label="Closing"
                  value={localLetter.closing}
                  applicationId={applicationId}
                  onChange={(v) => { setLocalLetter({ ...localLetter, closing: v }); setLetterDirty(true); }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

function EditableParagraph({
  label,
  value,
  applicationId,
  onChange,
}: {
  label: string;
  value: string;
  applicationId: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      <AssistBar compact applicationId={applicationId} text={value} onApply={onChange} />
    </div>
  );
}

function SectionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full truncate rounded-md px-3 py-2 text-left text-sm ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
    >
      {children}
    </button>
  );
}
