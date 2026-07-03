export const AUTH_DISABLE_SESSION_COOKIE_CACHE_ENV_KEY = "AUTH_DISABLE_SESSION_COOKIE_CACHE";

type AuthSessionCookieCacheQuery = {
  disableCookieCache: true;
};

type AuthGetSessionOptions = {
  headers: Headers;
  query?: AuthSessionCookieCacheQuery;
};

export const isAuthSessionCookieCacheDisabled = () =>
  process.env[AUTH_DISABLE_SESSION_COOKIE_CACHE_ENV_KEY] === "true";

export const getAuthSessionOptions = (headers: Headers): AuthGetSessionOptions => {
  if (!isAuthSessionCookieCacheDisabled()) {
    return { headers };
  }

  return {
    headers,
    query: {
      disableCookieCache: true,
    },
  };
};
