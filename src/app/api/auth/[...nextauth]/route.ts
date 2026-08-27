import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';
import { buildAuthOptions } from '@/lib/auth';

async function readRemember(req: NextRequest): Promise<boolean> {
  try {
    const form = await req.clone().formData();
    const value = form.get('remember');
    if (value === null) return true;
    return value === 'true';
  } catch {
    return true;
  }
}

export async function GET(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  return NextAuth(buildAuthOptions(true))(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  const remember = await readRemember(req);
  return NextAuth(buildAuthOptions(remember))(req, ctx);
}
