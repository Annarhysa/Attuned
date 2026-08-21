'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { GenerationOptions, Length, OptimizationLevel, Tone } from '@/types';

const TONES: Tone[] = ['professional', 'confident', 'technical', 'startup', 'corporate', 'conversational'];
const LENGTHS: Length[] = ['short', 'medium', 'detailed'];
const LEVELS: OptimizationLevel[] = ['light', 'balanced', 'aggressive'];
const LANGUAGES = ['English', 'German', 'French', 'Spanish'];

export function GenerationPanel({
  onGenerate,
  generating,
}: {
  onGenerate: (options: GenerationOptions, generate: { resume: boolean; coverLetter: boolean }) => void;
  generating?: boolean;
}) {
  const [options, setOptions] = useState<GenerationOptions>({ tone: 'professional', length: 'medium', language: 'English', optimizationLevel: 'balanced' });
  const [genResume, setGenResume] = useState(true);
  const [genCover, setGenCover] = useState(true);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Generate Documents</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-2"><Checkbox checked={genResume} onChange={(e) => setGenResume(e.target.checked)} /> Tailored Resume</Label>
          <Label className="flex items-center gap-2"><Checkbox checked={genCover} onChange={(e) => setGenCover(e.target.checked)} /> Cover Letter</Label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <Select value={options.tone} onChange={(e) => setOptions((o) => ({ ...o, tone: e.target.value as Tone }))}>
              {TONES.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Length</Label>
            <Select value={options.length} onChange={(e) => setOptions((o) => ({ ...o, length: e.target.value as Length }))}>
              {LENGTHS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={options.language} onChange={(e) => setOptions((o) => ({ ...o, language: e.target.value }))}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Optimization Level</Label>
            <Select value={options.optimizationLevel} onChange={(e) => setOptions((o) => ({ ...o, optimizationLevel: e.target.value as OptimizationLevel }))}>
              {LEVELS.map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
            </Select>
          </div>
        </div>

        <Button className="w-full" disabled={generating || (!genResume && !genCover)} onClick={() => onGenerate(options, { resume: genResume, coverLetter: genCover })}>
          {generating ? 'Generating...' : 'Generate'}
        </Button>
      </CardContent>
    </Card>
  );
}
