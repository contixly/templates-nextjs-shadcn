import "server-only";

import { auth } from "@server/auth";
import { headers } from "next/headers";
import { USER_ID_HEADER } from "@features/accounts/accounts-types";
import { cache } from "react";

/**
 * Memoize request headers and auth lookups during a single render pass to avoid
 * repeated session/account queries from multiple server components.
 */
const loadRequestHeaders = cache(async () => headers());

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
 */
export const loadCurrentUserSessions = cache(async () =>
  auth.api.listSessions({
    headers: await loadRequestHeaders(),
  })
);

/**
 * Loads the authenticated user entity from the current session payload.
 */
export const loadCurrentUser = cache(async () => {
  const session = await loadSessionPayload();

  return session?.user;
});

/**
 * Reads user id injected by middleware into request headers.
 */
export const loadCurrentUserId = cache(async () => {
  const headersList = await loadRequestHeaders();
  return headersList.get(USER_ID_HEADER);
});
