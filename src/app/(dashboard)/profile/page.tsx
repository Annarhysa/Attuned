'use client';

import { useEffect, useState } from 'react';
import { CandidateProfileForm } from '@/features/candidate-profile/CandidateProfileForm';
import { ResumeUploader } from '@/features/candidate-profile/ResumeUploader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CandidateProfile } from '@/types';
import { Download, FileText } from 'lucide-react';

const EMPTY_PROFILE: CandidateProfile = {
  fullName: '', professionalTitle: '', location: '', email: '', phone: '', linkedin: '', github: '', portfolio: '',
  summary: '', languages: [], experiences: [], education: [], projects: [], skills: [], certifications: [], achievements: [],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => setProfile(data.profile || EMPTY_PROFILE));
  }, []);

  async function handleSave(finalProfile: CandidateProfile) {
    setSaving(true);
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalProfile),
    });
    const data = await res.json();
    setProfile(data.profile);
    setFormKey((k) => k + 1);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  function handleReplaced(extracted: CandidateProfile, fileId?: string) {
    setProfile({ ...extracted, originalResumeFileId: fileId || profile?.originalResumeFileId });
    setFormKey((k) => k + 1); // force the form to remount with the freshly-extracted fields
    setShowUploader(false);
  }

  if (!profile) return <p className="text-sm text-muted-foreground">Loading profile...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">This is the only source of truth the AI uses -- keep it accurate and complete.</p>
        {savedMsg && <p className="mt-2 text-sm text-success">Profile saved.</p>}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {profile.originalResumeFileId ? (
              <span>A resume is on file.</span>
            ) : (
              <span className="text-muted-foreground">No resume uploaded yet -- your profile was entered manually or is incomplete.</span>
            )}
          </div>
          <div className="flex gap-2">
            {profile.originalResumeFileId && (
              <a href="/api/profile/resume">
                <Button size="sm" variant="outline" className="gap-2"><Download className="h-4 w-4" /> Download</Button>
              </a>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowUploader((s) => !s)}>
              {showUploader ? 'Cancel' : profile.originalResumeFileId ? 'Replace resume' : 'Upload resume'}
            </Button>
          </div>
        </CardContent>
        {showUploader && (
          <CardContent className="pt-0">
            <p className="mb-3 text-xs text-muted-foreground">
              We&apos;ll re-extract your profile from the new file. Review the fields below and click Save Profile to confirm -- nothing is saved until you do.
            </p>
            <ResumeUploader onExtracted={handleReplaced} />
          </CardContent>
        )}
      </Card>

      <CandidateProfileForm key={formKey} initial={profile} onSave={handleSave} saving={saving} />
    </div>
  );
}
