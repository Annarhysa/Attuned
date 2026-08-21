import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { extractTextFromFile, parseResumeText } from '@/services/resumeParser';
import { saveOriginalFile } from '@/lib/storage';

export async function POST(req: Request) {
  await requireUserId();

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = await saveOriginalFile(buffer, file.name);

  let rawText = '';
  try {
    rawText = await extractTextFromFile(buffer, file.name);
  } catch (err) {
    return NextResponse.json({ error: 'Could not parse this file. Try PDF, DOCX, or TXT.' }, { status: 422 });
  }

  const profile = parseResumeText(rawText);

  return NextResponse.json({ fileId, rawText, profile });
}
