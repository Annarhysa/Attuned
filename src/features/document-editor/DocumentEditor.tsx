'use client';

import { useState } from 'react';
import { CoverLetterDraft, TailoredResumeDraft } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssistBar } from './AssistBar';
import { DiffView } from './DiffView';

type Section =
  | { kind: 'summary' }
  | { kind: 'skills' }
  | { kind: 'experience'; idx: number }
  | { kind: 'project'; idx: number };

export function DocumentEditor({
  applicationId,
  draft,
  letter,
  onChangeDraft,
  onChangeLetter,
}: {
  applicationId: string;
  draft: TailoredResumeDraft | null;
  letter: CoverLetterDraft | null;
  onChangeDraft: (d: TailoredResumeDraft) => void;
  onChangeLetter: (l: CoverLetterDraft) => void;
}) {
  const [section, setSection] = useState<Section>({ kind: 'summary' });
  const [showDiff, setShowDiff] = useState(true);

  if (!draft && !letter) {
    return <p className="text-sm text-muted-foreground">Generate a document first to start editing.</p>;
  }

  return (
    <Tabs defaultValue={draft ? 'resume' : 'cover'}>
      <TabsList>
        {draft && <TabsTrigger value="resume">Resume</TabsTrigger>}
        {letter && <TabsTrigger value="cover">Cover Letter</TabsTrigger>}
      </TabsList>

      {draft && (
        <TabsContent value="resume" className="mt-4">
          <div className="grid gap-4 md:grid-cols-[180px_1fr_280px]">
            <nav className="space-y-1">
              <SectionButton active={section.kind === 'summary'} onClick={() => setSection({ kind: 'summary' })}>Summary</SectionButton>
              <SectionButton active={section.kind === 'skills'} onClick={() => setSection({ kind: 'skills' })}>Skills</SectionButton>
              {draft.experiences.map((e, i) => (
                <SectionButton key={i} active={section.kind === 'experience' && section.idx === i} onClick={() => setSection({ kind: 'experience', idx: i })}>
                  {e.entry.title || `Experience ${i + 1}`}
                </SectionButton>
              ))}
              {draft.projects.map((p, i) => (
                <SectionButton key={i} active={section.kind === 'project' && section.idx === i} onClick={() => setSection({ kind: 'project', idx: i })}>
                  {p.entry.name || `Project ${i + 1}`}
                </SectionButton>
              ))}
            </nav>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm capitalize">{section.kind}</CardTitle>
                <button className="text-xs text-muted-foreground underline" onClick={() => setShowDiff((s) => !s)}>
                  {showDiff ? 'Hide changes' : 'Show changes'}
                </button>
              </CardHeader>
              <CardContent className="space-y-3">
                {section.kind === 'summary' && (
                  <>
                    {showDiff && <DiffView before={draft.summary.before} after={draft.summary.after} />}
                    <Textarea rows={5} value={draft.summary.after} onChange={(e) => onChangeDraft({ ...draft, summary: { ...draft.summary, after: e.target.value, changed: true } })} />
                  </>
                )}
                {section.kind === 'skills' && (
                  <Input
                    value={draft.skills.after.join(', ')}
                    onChange={(e) => onChangeDraft({ ...draft, skills: { ...draft.skills, after: e.target.value.split(',').map((s) => s.trim()).filter(Boolean), changed: true } })}
                  />
                )}
                {section.kind === 'experience' && draft.experiences[section.idx] && (
                  <div className="space-y-3">
                    {draft.experiences[section.idx].afterBullets.map((b, bi) => (
                      <div key={bi} className="space-y-1">
                        {showDiff && draft.experiences[section.idx].beforeBullets[bi] && (
                          <DiffView before={draft.experiences[section.idx].beforeBullets[bi]} after={b} />
                        )}
                        <Textarea
                          rows={2}
                          value={b}
                          onChange={(e) => {
                            const next = [...draft.experiences];
                            const bullets = [...next[section.idx].afterBullets];
                            bullets[bi] = e.target.value;
                            next[section.idx] = { ...next[section.idx], afterBullets: bullets, changed: true };
                            onChangeDraft({ ...draft, experiences: next });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {section.kind === 'project' && draft.projects[section.idx] && (
                  <div className="space-y-3">
                    {draft.projects[section.idx].afterBullets.map((b, bi) => (
                      <Textarea
                        key={bi}
                        rows={2}
                        value={b}
                        onChange={(e) => {
                          const next = [...draft.projects];
                          const bullets = [...next[section.idx].afterBullets];
                          bullets[bi] = e.target.value;
                          next[section.idx] = { ...next[section.idx], afterBullets: bullets, changed: true };
                          onChangeDraft({ ...draft, projects: next });
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">AI Assistant</CardTitle></CardHeader>
              <CardContent>
                <AssistBar
                  applicationId={applicationId}
                  text={
                    section.kind === 'summary' ? draft.summary.after :
                    section.kind === 'skills' ? draft.skills.after.join(', ') :
                    section.kind === 'experience' ? draft.experiences[section.idx]?.afterBullets.join(' ') || '' :
                    draft.projects[section.idx]?.afterBullets.join(' ') || ''
                  }
                  onApply={(newText) => {
                    if (section.kind === 'summary') onChangeDraft({ ...draft, summary: { ...draft.summary, after: newText, changed: true } });
                    if (section.kind === 'skills') onChangeDraft({ ...draft, skills: { ...draft.skills, after: newText.split(',').map((s) => s.trim()).filter(Boolean), changed: true } });
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {draft.omittedKeywords.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Intentionally not added (no evidence in your profile): {draft.omittedKeywords.join(', ')}
            </p>
          )}
        </TabsContent>
      )}

      {letter && (
        <TabsContent value="cover" className="mt-4">
          <div className="grid gap-4 md:grid-cols-[1fr_280px]">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <Textarea rows={2} value={letter.opening} onChange={(e) => onChangeLetter({ ...letter, opening: e.target.value })} />
                {letter.body.map((p, i) => (
                  <Textarea
                    key={i}
                    rows={3}
                    value={p}
                    onChange={(e) => {
                      const body = [...letter.body];
                      body[i] = e.target.value;
                      onChangeLetter({ ...letter, body });
                    }}
                  />
                ))}
                <Textarea rows={3} value={letter.domainParagraph} onChange={(e) => onChangeLetter({ ...letter, domainParagraph: e.target.value })} />
                <Textarea rows={2} value={letter.closing} onChange={(e) => onChangeLetter({ ...letter, closing: e.target.value })} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">AI Assistant</CardTitle></CardHeader>
              <CardContent>
                <AssistBar
                  applicationId={applicationId}
                  text={letter.opening}
                  onApply={(newText) => onChangeLetter({ ...letter, opening: newText })}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      )}
    </Tabs>
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
