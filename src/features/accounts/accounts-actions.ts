import "server-only";

import { auth } from "@server/auth";
import { headers } from "next/headers";
import { cache } from "react";
import type { UserSessionListItem } from "@features/accounts/accounts-types";

/**
 * Memoize request headers and auth lookups during a single render pass to avoid
 * repeated session/account queries from multiple server components.
 */
export const loadRequestHeaders = cache(async () => headers());

const loadSessionPayload = cache(async () =>
  auth.api.getSession({
    headers: await loadRequestHeaders(),
  })
);

export const loadCurrentSession = cache(async () => {
  const session = await loadSessionPayload();
  return session?.session;
});

/**
 * Loads the list of connected auth providers for the current user.
 */
export const loadCurrentUserAccounts = cache(async () =>
  auth.api.listUserAccounts({
    headers: await loadRequestHeaders(),
  })
);

/**
 * Loads all active sessions for the current user.
 *
 * This raw loader is server-only because Better Auth session records include
 * bearer-like tokens. Client-facing code must use loadCurrentUserSessionList.
 */
export const loadCurrentUserSessions = cache(async () =>
  auth.api.listSessions({
    headers: await loadRequestHeaders(),
  })
);

export const loadCurrentUserSessionList = cache(async (): Promise<UserSessionListItem[]> => {
  const [sessions, currentSession] = await Promise.all([
    loadCurrentUserSessions(),
    loadCurrentSession(),
  ]);

  return sessions
    .map((session) => ({
      id: session.id,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      isCurrent: session.id === currentSession?.id,
    }))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
});

/**
 * Loads the authenticated user entity from the current session payload.
 */
export const loadCurrentUser = cache(async () => {
  const session = await loadSessionPayload();

  return session?.user;
});

/**
 * Loads the current authenticated user id from a freshly validated session.
 *
 * Server Actions are public-facing endpoints, so they must not trust a
 * client-supplied or middleware-forwarded user id header as their auth boundary.
 */
export const loadCurrentUserId = cache(async () => {
  const session = await loadSessionPayload();
  return session?.user?.id ?? null;
});
