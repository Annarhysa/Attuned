'use client';

import { useState } from 'react';
import { CandidateProfile, EducationEntry, ExperienceEntry, ProjectEntry, SkillEntry } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';

function emptyExperience(): ExperienceEntry {
  return { company: '', title: '', location: '', startDate: '', endDate: '', bullets: [''] };
}
function emptyEducation(): EducationEntry {
  return { institution: '', degree: '', field: '', startDate: '', endDate: '', details: '' };
}
function emptyProject(): ProjectEntry {
  return { name: '', description: '', bullets: [''], technologies: [] };
}

export function CandidateProfileForm({
  initial,
  onSave,
  saving,
}: {
  initial: CandidateProfile;
  onSave: (profile: CandidateProfile) => void;
  saving?: boolean;
}) {
  const [profile, setProfile] = useState<CandidateProfile>(initial);

  function update<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function updateExperience(idx: number, patch: Partial<ExperienceEntry>) {
    setProfile((p) => ({ ...p, experiences: p.experiences.map((e, i) => (i === idx ? { ...e, ...patch } : e)) }));
  }
  function updateBullet(idx: number, bulletIdx: number, value: string, kind: 'experiences' | 'projects') {
    setProfile((p) => ({
      ...p,
      [kind]: (p[kind] as (ExperienceEntry | ProjectEntry)[]).map((e, i) =>
        i === idx ? { ...e, bullets: e.bullets.map((b, bi) => (bi === bulletIdx ? value : b)) } : e
      ),
    }) as CandidateProfile);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name"><Input value={profile.fullName} onChange={(e) => update('fullName', e.target.value)} /></Field>
          <Field label="Professional Title"><Input value={profile.professionalTitle} onChange={(e) => update('professionalTitle', e.target.value)} /></Field>
          <Field label="Location"><Input value={profile.location} onChange={(e) => update('location', e.target.value)} /></Field>
          <Field label="Email"><Input value={profile.email} onChange={(e) => update('email', e.target.value)} /></Field>
          <Field label="Phone"><Input value={profile.phone} onChange={(e) => update('phone', e.target.value)} /></Field>
          <Field label="LinkedIn"><Input value={profile.linkedin} onChange={(e) => update('linkedin', e.target.value)} /></Field>
          <Field label="GitHub"><Input value={profile.github} onChange={(e) => update('github', e.target.value)} /></Field>
          <Field label="Portfolio"><Input value={profile.portfolio} onChange={(e) => update('portfolio', e.target.value)} /></Field>
          <div className="md:col-span-2">
            <Field label="Professional Summary">
              <Textarea rows={4} value={profile.summary} onChange={(e) => update('summary', e.target.value)} />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Experience</CardTitle>
          <Button size="sm" variant="outline" onClick={() => update('experiences', [...profile.experiences, emptyExperience()])}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.experiences.map((exp, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border border-border p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Company"><Input value={exp.company} onChange={(e) => updateExperience(idx, { company: e.target.value })} /></Field>
                <Field label="Title"><Input value={exp.title} onChange={(e) => updateExperience(idx, { title: e.target.value })} /></Field>
                <Field label="Start Date"><Input value={exp.startDate} onChange={(e) => updateExperience(idx, { startDate: e.target.value })} /></Field>
                <Field label="End Date"><Input value={exp.endDate} onChange={(e) => updateExperience(idx, { endDate: e.target.value })} placeholder="Present" /></Field>
              </div>
              <div className="space-y-2">
                <Label>Bullets (real achievements only)</Label>
                {exp.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <Textarea rows={2} value={b} onChange={(e) => updateBullet(idx, bi, e.target.value, 'experiences')} />
                    <Button size="icon" variant="ghost" onClick={() => updateExperience(idx, { bullets: exp.bullets.filter((_, i) => i !== bi) })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => updateExperience(idx, { bullets: [...exp.bullets, ''] })}>+ Add bullet</Button>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => update('experiences', profile.experiences.filter((_, i) => i !== idx))}>
                Remove experience
              </Button>
            </div>
          ))}
          {profile.experiences.length === 0 && <p className="text-sm text-muted-foreground">No experience added yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projects</CardTitle>
          <Button size="sm" variant="outline" onClick={() => update('projects', [...profile.projects, emptyProject()])}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {profile.projects.map((proj, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border border-border p-4">
              <Field label="Name"><Input value={proj.name} onChange={(e) => setProfile((p) => ({ ...p, projects: p.projects.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) }))} /></Field>
              <Field label="Technologies (comma-separated)">
                <Input
                  value={proj.technologies.join(', ')}
                  onChange={(e) => setProfile((p) => ({ ...p, projects: p.projects.map((x, i) => (i === idx ? { ...x, technologies: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : x)) }))}
                />
              </Field>
              <div className="space-y-2">
                <Label>Bullets</Label>
                {proj.bullets.map((b, bi) => (
                  <Textarea key={bi} rows={2} value={b} onChange={(e) => updateBullet(idx, bi, e.target.value, 'projects')} />
                ))}
                <Button size="sm" variant="ghost" onClick={() => setProfile((p) => ({ ...p, projects: p.projects.map((x, i) => (i === idx ? { ...x, bullets: [...x.bullets, ''] } : x)) }))}>+ Add bullet</Button>
              </div>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => update('projects', profile.projects.filter((_, i) => i !== idx))}>Remove project</Button>
            </div>
          ))}
          {profile.projects.length === 0 && <p className="text-sm text-muted-foreground">No projects added yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Education</CardTitle>
          <Button size="sm" variant="outline" onClick={() => update('education', [...profile.education, emptyEducation()])}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.education.map((ed, idx) => (
            <div key={idx} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2">
              <Field label="Institution"><Input value={ed.institution} onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((x, i) => (i === idx ? { ...x, institution: e.target.value } : x)) }))} /></Field>
              <Field label="Degree"><Input value={ed.degree} onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((x, i) => (i === idx ? { ...x, degree: e.target.value } : x)) }))} /></Field>
              <Field label="Start Date"><Input value={ed.startDate} onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((x, i) => (i === idx ? { ...x, startDate: e.target.value } : x)) }))} /></Field>
              <Field label="End Date"><Input value={ed.endDate} onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((x, i) => (i === idx ? { ...x, endDate: e.target.value } : x)) }))} /></Field>
              <div className="md:col-span-2">
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => update('education', profile.education.filter((_, i) => i !== idx))}>Remove</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label>Comma-separated list of your real skills</Label>
          <Textarea
            rows={3}
            value={profile.skills.map((s) => s.name).join(', ')}
            onChange={(e) =>
              update(
                'skills',
                e.target.value.split(',').map((name) => ({ name: name.trim(), category: 'technical' as const })).filter((s) => s.name)
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Certifications & Achievements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Certifications (one per line)</Label>
            <Textarea
              rows={3}
              value={profile.certifications.map((c) => c.name).join('\n')}
              onChange={(e) => update('certifications', e.target.value.split('\n').filter(Boolean).map((name) => ({ name })))}
            />
          </div>
          <Separator />
          <div>
            <Label>Achievements (one per line)</Label>
            <Textarea
              rows={3}
              value={profile.achievements.join('\n')}
              onChange={(e) => update('achievements', e.target.value.split('\n').filter(Boolean))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" disabled={saving} onClick={() => onSave(profile)}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
