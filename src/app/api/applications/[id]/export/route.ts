import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';
import { toDomainProfile } from '@/lib/profileMapper';
import { CoverLetterDraft, DesignTemplate, TailoredResumeDraft } from '@/types';
import { renderCoverLetterDOCX, renderCoverLetterPDF, renderResumeDOCX, renderResumePDF } from '@/services/documentExporter';

function slug(s: string) {
  return (s || 'application').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'application';
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'package';

  const application = await prisma.application.findFirst({
    where: { id: params.id, userId },
    include: { job: true, documents: true, designTemplate: true },
  });
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const profileRow = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, education: true, projects: true, skills: true, certifications: true, achievements: true },
  });
  if (!profileRow) return NextResponse.json({ error: 'Candidate profile not found.' }, { status: 400 });
  const profile = toDomainProfile(profileRow);

  const resumeDoc = application.documents.find((d) => d.type === 'resume_tailored');
  const letterDoc = application.documents.find((d) => d.type === 'cover_letter');
  const draft = resumeDoc ? safeJsonParse<TailoredResumeDraft | null>(resumeDoc.content, null) : null;
  const letter = letterDoc ? safeJsonParse<CoverLetterDraft | null>(letterDoc.content, null) : null;
  const design: DesignTemplate | null = application.designTemplate as unknown as DesignTemplate | null;

  const base = `${slug(application.job.company)}_${slug(application.job.title)}`;

  if (format === 'resume-pdf' || format === 'resume-docx') {
    if (!draft) return NextResponse.json({ error: 'Generate a tailored resume first.' }, { status: 400 });
    const buffer = format === 'resume-pdf' ? await renderResumePDF(profile, draft, design) : await renderResumeDOCX(profile, draft);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': format === 'resume-pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${base}_Resume.${format === 'resume-pdf' ? 'pdf' : 'docx'}"`,
      },
    });
  }

  if (format === 'cover-pdf' || format === 'cover-docx') {
    if (!letter) return NextResponse.json({ error: 'Generate a cover letter first.' }, { status: 400 });
    const buffer = format === 'cover-pdf' ? await renderCoverLetterPDF(letter, design) : await renderCoverLetterDOCX(letter);
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': format === 'cover-pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${base}_CoverLetter.${format === 'cover-pdf' ? 'pdf' : 'docx'}"`,
      },
    });
  }

  // Full application package
  const zip = new JSZip();
  if (draft) {
    zip.file(`${base}_Resume.pdf`, await renderResumePDF(profile, draft, design));
    zip.file(`${base}_Resume.docx`, await renderResumeDOCX(profile, draft));
  }
  if (letter) {
    zip.file(`${base}_CoverLetter.pdf`, await renderCoverLetterPDF(letter, design));
    zip.file(`${base}_CoverLetter.docx`, await renderCoverLetterDOCX(letter));
  }
  if (!draft && !letter) return NextResponse.json({ error: 'Nothing to export yet.' }, { status: 400 });

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${base}_Application.zip"`,
    },
  });
}
