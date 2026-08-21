import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getAIProvider } from '@/lib/ai';
import { extractTextFromFile } from '@/services/resumeParser';
import { toJson } from '@/lib/utils';

export async function POST(req: Request) {
  await requireUserId();

  const contentType = req.headers.get('content-type') || '';
  let rawText = '';
  let sourceType = 'paste';

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    sourceType = (formData.get('sourceType') as string) || 'upload';
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      rawText = await extractTextFromFile(buffer, file.name);
    } else if (text) {
      rawText = text;
    }
  } else {
    const body = await req.json();
    rawText = body.text || '';
    sourceType = body.sourceType || 'paste';
  }

  if (!rawText || rawText.trim().length < 10) {
    return NextResponse.json({ error: 'Please provide a job description, keywords, or a file with enough content to analyze.' }, { status: 400 });
  }

  const provider = getAIProvider();
  const analysis = await provider.analyzeJob(rawText);

  const job = await prisma.job.create({
    data: {
      rawText,
      sourceType,
      title: analysis.job_title,
      company: analysis.company,
      location: analysis.location || '',
      employmentType: analysis.employment_type || '',
      analysis: {
        create: {
          niche: analysis.industry,
          seniority: analysis.seniority,
          requiredSkills: toJson(analysis.required_skills),
          preferredSkills: toJson(analysis.preferred_skills),
          responsibilities: toJson(analysis.responsibilities),
          keywords: toJson(analysis.keywords),
          softSkills: toJson(analysis.soft_skills),
          technologies: toJson(analysis.technologies),
          domainTerms: toJson(analysis.domain_terms),
          importantPhrases: toJson(analysis.important_phrases),
          companySignals: toJson(analysis.company_signals),
          tone: analysis.tone,
          matchStrategy: analysis.match_strategy,
        },
      },
    },
  });

  return NextResponse.json({ jobId: job.id, analysis });
}
