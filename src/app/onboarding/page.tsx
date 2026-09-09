'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResumeUploader } from '@/features/candidate-profile/ResumeUploader';
import { CandidateProfileForm } from '@/features/candidate-profile/CandidateProfileForm';
import { Button } from '@/components/ui/button';
import { CandidateProfile } from '@/types';
import { CheckCircle2, MailCheck } from 'lucide-react';

const EMPTY_PROFILE: CandidateProfile = {
  fullName: '', professionalTitle: '', location: '', email: '', phone: '', linkedin: '', github: '', portfolio: '',
  summary: '', languages: [], experiences: [], education: [], projects: [], skills: [], certifications: [], achievements: [],
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('justRegistered') === 'true';
  const devPreview = searchParams.get('preview');
  const [step, setStep] = useState<'upload' | 'verify'>('upload');
  const [profile, setProfile] = useState<CandidateProfile>(EMPTY_PROFILE);
  const [fileId, setFileId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleExtracted(extracted: CandidateProfile, uploadedFileId?: string) {
    setProfile(extracted);
    setFileId(uploadedFileId);
    setStep('verify');
  }

  async function handleSave(finalProfile: CandidateProfile) {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...finalProfile, originalResumeFileId: fileId }),
    });
    setSaving(false);
    router.push('/applications/new');
  }

  return (
    <main className="min-h-screen bg-secondary/40 py-12">
      <div className="container max-w-3xl">
        {justRegistered && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p>We&apos;ve sent a verification link to your email. Click it whenever you get a chance -- it&apos;s not required to keep using Attuned.</p>
              {devPreview && (
                <p className="text-muted-foreground">
                  No email server is configured, so here&apos;s the link directly:{' '}
                  <a href={devPreview} className="break-all text-primary underline">{devPreview}</a>
                </p>
              )}
            </div>
          </div>
        )}
        <div className="mb-8 flex items-center justify-center gap-4 text-sm">
          {['Upload resume', 'Verify profile'].map((label, i) => {
            const isActive = (i === 0 && step === 'upload') || (i === 1 && step === 'verify');
            const isDone = i === 0 && step === 'verify';
            return (
              <div key={label} className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </span>
                <span className={isActive ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
                {i === 0 && <span className="mx-2 h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        {step === 'upload' && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Let&apos;s build your candidate profile</h1>
            <p className="text-muted-foreground">Upload your resume and we&apos;ll extract a structured profile for you to verify. Nothing is invented -- only what&apos;s in your resume.</p>
            <div className="pt-4">
              <ResumeUploader onExtracted={handleExtracted} />
            </div>
            <Button variant="ghost" onClick={() => setStep('verify')}>Skip and enter manually</Button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Verify your information</h1>
              <p className="text-muted-foreground">Correct anything the extractor missed -- this profile is what the AI will use, and only this.</p>
            </div>
            <CandidateProfileForm initial={profile} onSave={handleSave} saving={saving} />
          </div>
        )}
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
