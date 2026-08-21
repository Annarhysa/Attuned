'use client';

import { useEffect, useState } from 'react';
import { CandidateProfileForm } from '@/features/candidate-profile/CandidateProfileForm';
import { CandidateProfile } from '@/types';

const EMPTY_PROFILE: CandidateProfile = {
  fullName: '', professionalTitle: '', location: '', email: '', phone: '', linkedin: '', github: '', portfolio: '',
  summary: '', languages: [], experiences: [], education: [], projects: [], skills: [], certifications: [], achievements: [],
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

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
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  if (!profile) return <p className="text-sm text-muted-foreground">Loading profile...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">This is the only source of truth the AI uses -- keep it accurate and complete.</p>
        {savedMsg && <p className="mt-2 text-sm text-success">Profile saved.</p>}
      </div>
      <CandidateProfileForm initial={profile} onSave={handleSave} saving={saving} />
    </div>
  );
}
