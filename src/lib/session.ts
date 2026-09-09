import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect('/login');
  return userId;
}

/** Redirects to onboarding if the user hasn't completed the resume/profile step yet. */
export async function requireOnboarded(userId: string): Promise<void> {
  const count = await prisma.candidateProfile.count({ where: { userId } });
  if (count === 0) redirect('/onboarding');
}

export async function requireFullProfile(userId: string) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, education: true, projects: true, skills: true, certifications: true, achievements: true },
  });
  if (!profile) redirect('/onboarding');
  return profile;
}
