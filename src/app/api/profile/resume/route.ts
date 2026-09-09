import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { readStoredFile } from '@/lib/storage';

export async function GET() {
  const userId = await requireUserId();
  const profile = await prisma.candidateProfile.findUnique({ where: { userId }, select: { originalResumeFileId: true } });
  if (!profile?.originalResumeFileId) {
    return NextResponse.json({ error: 'No resume on file.' }, { status: 404 });
  }

  const fileId = profile.originalResumeFileId;
  const buffer = await readStoredFile(fileId);
  const ext = fileId.includes('.') ? fileId.split('.').pop() : '';
  const contentType = ext === 'pdf' ? 'application/pdf' : ext === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'text/plain';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="resume${ext ? `.${ext}` : ''}"`,
    },
  });
}
