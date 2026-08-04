import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Page-level auth gate. (In this Next.js version the `middleware` file
 * convention is deprecated and renamed to `proxy`.)
 *
 * This is deliberately only an *optimistic* check — it tests that a session
 * cookie is present, not that it is valid, because proxy runs on the edge
 * away from the database and should stay cheap. The real check (HMAC signature,
 * expiry, user lookup, admin role) happens in the route handlers via
 * requireAuth/requireAdmin, which is what actually protects the data.
 */
export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('session')?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  // Send the user back where they were headed after signing in.
  loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  /**
   * Match every page except the ones needed to sign in or that must stay
   * publicly reachable. Static assets are excluded too — without that, the
   * redirect would also swallow CSS/JS and the login page itself would break.
   *
   * API routes are intentionally NOT matched: they enforce auth themselves and
   * must answer with 401/403 JSON rather than a redirect to an HTML page.
   */
  matcher: [
    '/((?!api|login|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.ico$).*)',
  ],
};
