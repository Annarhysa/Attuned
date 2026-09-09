import { NextResponse } from 'next/server';
import { consumeEmailVerificationToken } from '@/services/verification';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/login?verifyError=missing', url));

  const userId = await consumeEmailVerificationToken(token);
  if (!userId) return NextResponse.redirect(new URL('/login?verifyError=invalid', url));

  return NextResponse.redirect(new URL('/login?verified=true', url));
}
