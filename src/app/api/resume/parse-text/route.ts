import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { parseResumeText } from '@/services/resumeParser';

export async function POST(req: Request) {
  await requireUserId();
  const { text } = await req.json();
  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'No resume text provided.' }, { status: 400 });
  }
  const profile = parseResumeText(text);
  return NextResponse.json({ profile });
}
