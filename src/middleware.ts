export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/applications/:path*', '/templates/:path*', '/tracker/:path*', '/settings/:path*', '/onboarding'],
};
