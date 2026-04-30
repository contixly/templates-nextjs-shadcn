# Local Automation Auth Design

Date: 2026-04-30
Status: Approved for planning

## Context

The project uses Better Auth with OAuth providers for normal sign-in. That is the right production behavior, but it makes local browser automation difficult because Playwright, browser-use, and LLM-driven development agents need a repeatable way to create a user, authenticate, run protected flows, and remove the test user afterward.

The local automation flow must use the real Better Auth session path. A bypass cookie or hand-written session would be faster to wire, but it would not exercise the same session lookup, proxy protection, account deletion, or protected server action behavior as the application.

The repository already has:

- Better Auth configured in `src/server/auth.ts`
- the auth route handler at `src/app/api/auth/[...all]/route.ts`
- route protection in `src/proxy.ts`
- a protected account deletion action in `src/features/accounts/actions/delete-account.ts`
- Prisma relations that cascade from `User` to sessions, accounts, members, team memberships, and invitations sent

The main cleanup gap is organization data. If an automation user creates a workspace and is the only member, deleting the user does not necessarily delete the organization itself. Cleanup must remove those local-only organizations before deleting the user.

## Goals

- Provide a local-only API path for automated scenarios to create and authenticate a new user.
- Provide a local-only UI path from `/auth/login` for agents or developers using a browser manually.
- Use Better Auth credential sign-up/sign-in so the resulting cookies and sessions are real Better Auth sessions.
- Let the current local automation user delete itself and related data after a test run.
- Refuse to run in production and refuse to delete normal users.
- Document the short local automation workflow in `AGENTS.md`.

## Non-Goals

- Add email/password login for production users.
- Replace existing OAuth login providers.
- Build a general admin user-management surface.
- Support shared remote test environments.
- Add broad fixture generation beyond creating an authenticated local user.

## Decision Summary

Implement a guarded local automation auth feature with both API and UI entry points.

The feature is enabled only when all of these are true:

- `NODE_ENV !== "production"`
- an explicit environment flag, named `LOCAL_AUTOMATION_AUTH_ENABLED`, is set to `"true"`

When enabled, Better Auth email/password is available for local automation users. A local route handler creates a unique credential user through Better Auth, sets the Better Auth session cookie, and returns the generated credentials for the test runner. A local-only login page panel calls the same route so browser-driven agents can create a new authenticated user without leaving the app.

Cleanup is a protected local route. It validates the current session, confirms the current user is in the automation email namespace, removes local-only organizations owned solely by that user, and then deletes the user through Better Auth.

## Design

### 1. Local Feature Gate

Create a small server-only helper that centralizes the gate:

```ts
export const LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN = "local-agent.test";
export const isLocalAutomationAuthEnabled = () =>
  process.env.NODE_ENV !== "production" &&
  process.env.LOCAL_AUTOMATION_AUTH_ENABLED === "true";
```

All local automation auth code must call this helper instead of duplicating environment checks.

Better Auth `emailAndPassword.enabled` should use this helper. This keeps production and ordinary local development behavior unchanged unless the developer explicitly opts in.

### 2. Automation User Namespace

Generated users use a reserved test email domain:

```text
local-agent+<unique-id>@local-agent.test
```

Cleanup is allowed only for users whose normalized email ends with `@local-agent.test` and starts with `local-agent+`. This prevents the cleanup route from deleting real OAuth users or manually created credential users.

Generated names can use a stable prefix such as `Local Automation <short-id>`. Generated passwords should be random, long enough for Better Auth password policy, and returned only in the create response.

### 3. API Entry Point

Add a route handler such as:

```text
POST /api/local-auth/scenario
```

Request body:

```ts
{
  name?: string;
  email?: string;
  password?: string;
  redirect?: string;
}
```

Behavior:

- Return `404` when the local feature gate is disabled.
- Accept caller-provided credentials only inside the automation namespace.
- Generate missing `name`, `email`, and `password`.
- Create and authenticate the user through Better Auth `signUpEmail`.
- If an explicit email already exists, return `409`.
- If generated email collides, generate another value and retry a small bounded number of times.
- Return JSON with the user, email, password, and cleanup endpoint.
- Preserve the Better Auth `Set-Cookie` headers from `signUpEmail` so Playwright can reuse the authenticated browser context.

The route should be dynamic by nature because it reads the request body and mutates auth state. It must not use cached helpers.

### 4. Cleanup Entry Point

Add a protected local cleanup route such as:

```text
DELETE /api/local-auth/scenario
```

Behavior:

- Return `404` when the local feature gate is disabled.
- Return `401` when there is no current Better Auth session.
- Return `403` when the current user is not in the automation namespace.
- Delete organizations where the automation user is the only member.
- Delete the current user through Better Auth `deleteUser`.
- Sign out and clear the session cookie through Better Auth behavior.
- Return `{ success: true }` when cleanup completes.

Organizations with other members should not be deleted by this route. The user deletion cascade will remove the automation user's memberships and team memberships.

### 5. UI Entry Point

Add a small local-only panel on `/auth/login`.

The panel should render only when the local feature gate is enabled. It should not be hidden only with CSS; the component should not render at all when disabled.

The primary control is a button:

```text
Create local automation user
```

On click:

- call `POST /api/local-auth/scenario`
- rely on the returned Better Auth cookie
- redirect to the sanitized `redirect` search parameter, or to the app's default post-login route
- show a toast or inline error if the local route returns an error

The UI is for local development ergonomics. The API is the canonical path for automated tests.

### 6. Cleanup UI

The required cleanup interface is the API route. A visible cleanup button is optional.

If a cleanup UI is added, it must also render only under the local feature gate and only for automation namespace users. A good location would be the account dangerous zone because that is already where account deletion lives.

The first implementation can omit the cleanup UI as long as `AGENTS.md` documents the API cleanup call.

### 7. Documentation

Add a short `AGENTS.md` section for local automation:

1. Set `LOCAL_AUTOMATION_AUTH_ENABLED=true` in local env.
2. Start the app with `npm run dev`.
3. In Playwright or another HTTP-aware browser context, call `POST /api/local-auth/scenario`.
4. Use the same browser context to test protected pages.
5. Call `DELETE /api/local-auth/scenario` from the same authenticated context to clean up the current automation user.

The docs should explicitly say the flow is local-only and must not be enabled in production.

## Error Handling

| Case | Response |
| --- | --- |
| Feature gate disabled | `404` |
| Invalid request body | `400` |
| Explicit email outside automation namespace | `400` |
| Explicit email already exists | `409` |
| Better Auth sign-up/sign-in failure | matching `4xx` when known, otherwise `500` |
| Cleanup without session | `401` |
| Cleanup for non-automation user | `403` |

Route handlers should return compact JSON errors with stable message strings that are easy for automated clients to inspect.

## Security Notes

- The feature is opt-in and non-production only.
- The UI does not render when the local gate is disabled.
- Cleanup validates both an authenticated Better Auth session and the automation email namespace.
- The cleanup route deletes only organizations where the current automation user is the sole member.
- No static shared password is introduced.
- The generated password is returned once to the caller for local testing only.

## Testing

### Unit Tests

- Feature gate helper returns false in production.
- Feature gate helper returns false when the local env flag is absent.
- Feature gate helper returns true only in non-production with `LOCAL_AUTOMATION_AUTH_ENABLED=true`.
- Automation email namespace validation accepts generated local-agent users and rejects normal emails.
- Cleanup organization selection targets only sole-member organizations.

### Route Tests

- `POST /api/local-auth/scenario` returns `404` when disabled.
- `POST /api/local-auth/scenario` rejects explicit non-automation emails.
- `DELETE /api/local-auth/scenario` returns `401` without a session.
- `DELETE /api/local-auth/scenario` returns `403` for non-automation users.

### Local Browser Verification

- Start `npm run dev` with `LOCAL_AUTOMATION_AUTH_ENABLED=true`.
- Create a local automation user through the login page panel.
- Confirm a protected page loads without redirecting to `/auth/login`.
- Call cleanup from the same authenticated browser context.
- Confirm protected pages redirect to `/auth/login` after cleanup.

## Implementation Placement

Use the existing accounts feature as the feature boundary. Local automation auth is account/auth behavior, and placing it under accounts avoids feature-to-feature dependencies.

Files expected to change:

- `src/server/auth.ts`
- `src/features/accounts/accounts-local-auth.ts`
- `src/features/accounts/accounts-local-auth-repository.ts`
- `src/app/api/local-auth/scenario/route.ts`
- `src/app/(public)/(simple)/auth/login/page.tsx`
- `src/features/accounts/components/forms/local-automation-login-panel.tsx`
- tests under `test/features/accounts/`
- `AGENTS.md`

The login page should render the local panel as a sibling to the existing `LoginForm`, not inside the OAuth provider list. This keeps the production login form focused and lets the local panel disappear entirely when the feature gate is disabled.
