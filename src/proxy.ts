import { NextRequest, NextResponse } from "next/server";
import routes, { routesConfig } from "@features/routes";
import { auth } from "@server/auth";
import { createRouteMatcher } from "@lib/clerk/routes";
import { USER_ID_HEADER } from "@features/accounts/accounts-types";
import { detectOGBots, sanitizeRedirectPath } from "@lib/routes";

// Pre-compute route matchers for better performance
const isPublicRoute = createRouteMatcher(routesConfig.publicRoutes);
const isPublicStaticRoute = createRouteMatcher(routesConfig.publicStaticRoute);
const isPublicApiRoute = createRouteMatcher(routesConfig.publicApiRoute);
const isProtectedApiRoute = createRouteMatcher(routesConfig.protectedApiRoute);

/**
 * Authentication middleware that handles route protection and session validation.
 *
 * Security considerations:
 * - Public static routes are served directly without session validation
 * - Public routes bypass authentication entirely
 * - Public API routes are accessible without session validation
 * - Protected API routes require a valid session
 * - Unauthorized access redirects to log in with safe redirect handling
 */
export default async function authMiddleware(request: NextRequest) {
  if (isPublicStaticRoute(request)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });
  const requestHeaders = new Headers(request.headers);
  if (session?.user?.id) requestHeaders.set(USER_ID_HEADER, session.user.id);

  // Early return for public routes - no session validation needed
  if (isPublicRoute(request) || isPublicApiRoute(request)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle protected API routes
  if (isProtectedApiRoute(request)) {
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Handle protected page routes
  if (!session) {
    if (detectOGBots(request.headers)) {
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    const { pathname } = request.nextUrl;
    // Sanitize redirect URL to prevent open redirect vulnerabilities
    const safeRedirectPath = sanitizeRedirectPath(pathname);

    return NextResponse.redirect(
      new URL(
        routes.accounts.pages.login.path({
          query: { redirect: safeRedirectPath },
        }),
        request.url
      )
    );
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
