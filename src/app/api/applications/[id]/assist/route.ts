import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/utils';
import { applyAssist, AssistAction } from '@/lib/ai/textAssist';
import { MatchAnalysis } from '@/types';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const application = await prisma.application.findFirst({ where: { id: params.id, userId } });
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { action, text } = (await req.json()) as { action: AssistAction; text: string };
  const match = safeJsonParse<MatchAnalysis | null>(application.tailoredMatchAnalysis || application.matchAnalysis, null);

  const result = applyAssist(action, text, match?.evidence || []);
  return NextResponse.json(result);
}
