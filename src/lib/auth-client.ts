import "client-only";

import {
  genericOAuthClient,
  inferOrgAdditionalFields,
  lastLoginMethodClient,
  organizationClient,
} from "better-auth/client/plugins";
import { APP_BASE_URL, LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import routes from "@features/routes";
import { BetterAuthClientOptions } from "@better-auth/core";
import { SocialProviderType } from "@typings/auth";
import { createAuthClient } from "better-auth/client";
import type { auth } from "@server/auth";
import { sanitizeRedirectPath } from "@lib/routes";

/**
 * An authentication client instance for handling user authentication and authorization.
 *
 * This client is initialized with configuration options such as the base URL
 * and provides methods for managing authentication flows, including login, logout,
 * token management, and user session validation.
 *
 * The `authClient` is typically used to interact with an authentication server or service.
 *
 * Configuration:
 * - `baseURL`: The base URL of the authentication service or API.
 */
export const authClient = createAuthClient({
  baseURL: APP_BASE_URL,
  plugins: [
    lastLoginMethodClient({
      cookieName: LAST_LOGIN_METHOD_KEY,
    }),
    organizationClient({
      teams: {
        enabled: true,
      },
      schema: inferOrgAdditionalFields<typeof auth>(),
    }),
    genericOAuthClient(),
  ],
} as BetterAuthClientOptions);

/**
 * Asynchronously handles the sign-in process using a specified social login provider.
 *
 * @param {string} provider - The name of the social login provider to use for authentication (e.g., "google", "facebook").
 * @param {string} [redirectUrl] - Optional. The URL to redirect to after successful authentication.
 *                                 Defaults to "/dashboard" if not provided.
 * @param {SocialProviderType} type - Optional. The type of social login provider
 *
 * The sign-in process includes:
 * - Redirecting the user to the provider's authentication flow.
 * - Handling both successful sign-ins and errors.
 * - Redirecting newly registered users to a dedicated onboarding page.
 */
export const signIn = async (
  provider: string,
  redirectUrl?: string | null,
  type?: SocialProviderType
) => {
  const safeRedirectUrl = sanitizeRedirectPath(redirectUrl ?? "/dashboard");
  const safeNewUserRedirectUrl = sanitizeRedirectPath(redirectUrl ?? "/");

  const config = {
    provider,
    providerId: provider,
    /**
     * A URL to redirect after the user authenticates with the provider
     * @default "/"
     */
    callbackURL: safeRedirectUrl,
    /**
     * A URL to redirect if an error occurs during the sign-in process
     */
    errorCallbackURL: "/auth/error",
    /**
     * A URL to redirect if the user is newly registered
     */
    newUserCallbackURL: routes.accounts.pages.welcome.path({
      query: { redirect: safeNewUserRedirectUrl },
    }),
  };

  if (!type || type === "default") {
    return authClient.signIn.social(config);
  } else if (type === "oauth2") {
    // @ts-expect-error unknow method
    return authClient.signIn.oauth2(config);
  }
};

export const { signOut, useSession } = authClient;
