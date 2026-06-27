# API Key V1 Design

Date: 2026-06-27
Status: approved design

## Context

The template uses Next.js App Router, Better Auth, the Better Auth organization plugin,
Prisma, and FSD feature slices. The API key plugin dependency is installed, and the
server auth configuration is being prepared for two key families:

- `user-keys`, owned by `User.id`.
- `org-keys`, owned by `Organization.id`.

The external product API must be extensible for future applications built from this
template. Future developers should be able to add new product resources, actions,
roles, and route handlers without rewriting the API authentication boundary.

Relevant project and platform constraints:

- Next.js Route Handlers are the API surface for `/api/v1`.
- Proxy may perform broad authentication filtering, but route handlers must verify
  authorization close to the data access layer.
- Cache Components mode is enabled, so route handlers that read request headers must
  remain request-time API handlers. Cached repository functions may still be reused
  when their arguments fully encode the access scope.
- Better Auth API key permissions use `Record<string, string[]>`.
- Better Auth organization access control governs who can manage organization API
  keys, while API key permissions govern what a key can do after it is issued.

Docs consulted before design:

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md`
- Better Auth API Key plugin docs, including advanced access control and permissions.

## Goals

- Add a key-only external API boundary under `/api/v1`.
- Support personal user API keys and organization API keys.
- Make personal keys read data available to the owning user in the requested
  organization context.
- Make organization keys read data for their owning organization as an organization
  principal, not as the user who created the key.
- Provide typed, extensible resource/action permissions and presets.
- Provide a small read-only API surface that proves the authorization model.
- Keep future product API additions straightforward and repeatable.

## Non-Goals

- Do not build key-management UI in the first implementation.
- Do not allow browser session cookie authentication for `/api/v1`.
- Do not rely on active organization session state for API keys.
- Do not implement write product endpoints in v1.
- Do not expose raw Better Auth API key creation payloads to client code.
- Do not add pagination to the starter endpoints unless the implementation discovers
  that an endpoint can return unsafe unbounded data. Future product endpoints should
  add pagination before exposing large collections.

## Architecture

Create a focused feature slice at `src/features/api-keys/`.

Recommended files:

- `api-keys-permissions.ts`
  - Defines typed API key resources, actions, required permission records, and
    built-in presets.
- `api-keys-auth.ts`
  - Provides the shared runtime helpers used by `/api/v1` route handlers.
  - Extracts and verifies API keys.
  - Maps verified keys into an explicit API principal.
  - Resolves organization access for user and organization principals.
- `api-keys-types.ts`
  - Defines `ApiKeyPrincipal`, config ids, permission and error DTO types.
- `api-keys-errors.ts`
  - Defines stable API error codes and JSON response helpers.
- `api-keys-logger.ts`
  - Feature-specific structured logger.
- `actions/`
  - Contains future server actions for creating, updating, and revoking keys.
  - These actions must expose allowlisted presets, not raw server-only Better Auth
    fields, to the client.
- `api-keys-repository.ts`
  - Add only if list, revoke, or metadata reads require repository code outside
    Better Auth APIs.

Route handlers under `src/app/api/v1/**/route.ts` should be thin:

1. Validate path params and query params.
2. Call the shared API key auth helper with required permissions.
3. Resolve organization scope when the route is organization-scoped.
4. Call existing repositories or API-safe read functions.
5. Return `{ "data": ... }` JSON or a stable `{ "error": ... }` JSON error.

Better Auth configuration should keep two API key configurations:

- `user-keys`
  - `references: "user"`
  - default prefix such as `user_`
  - accepted request header: `x-api-key`
- `org-keys`
  - `references: "organization"`
  - default prefix such as `org_`
  - accepted request header: `x-api-key`

Prisma must include the Better Auth API key table model mapped to the plugin table
name `apikey`.

## Principal Model

`/api/v1` never treats an API key as a browser session.

The shared auth helper returns one of two explicit principals:

```ts
type ApiKeyPrincipal =
  | {
      type: "user";
      keyId: string;
      configId: "user-keys";
      userId: string;
      permissions: Record<string, string[]> | null;
    }
  | {
      type: "organization";
      keyId: string;
      configId: "org-keys";
      organizationId: string;
      permissions: Record<string, string[]> | null;
    };
```

Do not enable Better Auth `enableSessionForAPIKeys`. It would make a key look like a
session and would blur the user-key versus organization-key boundary.

## Permission Model

There are two separate permission layers.

Organization access control controls key management:

- Resource: `apiKey`
- Actions: `create`, `read`, `update`, `delete`
- Owners and admins can manage organization keys by default.
- Members cannot manage organization keys by default.

API key permissions control external API access:

```ts
{
  basic: ["read"],
  organization: ["read"],
  member: ["read"],
  team: ["read"],
  teamMember: ["read"]
}
```

Built-in presets:

- `basic-read`
  - `{ basic: ["read"] }`
- `organization-read`
  - `{ organization: ["read"] }`
- `organization-members-read`
  - `{ organization: ["read"], member: ["read"] }`
- `organization-teams-read`
  - `{ organization: ["read"], team: ["read"] }`
- `organization-team-members-read`
  - `{ organization: ["read"], team: ["read"], teamMember: ["read"] }`
- `organization-read-all`
  - `{ organization: ["read"], member: ["read"], team: ["read"], teamMember: ["read"] }`

The stored Better Auth API key `permissions` field remains the source of truth. Presets
are a safe creation and UI abstraction over the typed resource/action permission record.

Future applications extend the model by adding resources and actions to
`api-keys-permissions.ts`, adding optional presets, and checking those permissions in
new `/api/v1` route handlers.

## Organization Scope Rules

The organization context for personal keys is path-based:

```text
/api/v1/organizations/:organizationId/...
```

No `X-Organization-Id` header is part of the v1 contract.

Personal user key:

- Owned by `User.id`.
- May access an organization route only if the owning user is currently a member of
  the `organizationId` in the path.
- The route must not use active organization session state.

Organization key:

- Owned by `Organization.id`.
- Acts as a service principal for that organization.
- May access only the organization whose id equals the key `referenceId`.
- Does not inherit or preserve the creator's member role after issue.
- The creator's role only matters for key creation, update, revocation, and allowed
  scope selection.

## API Routes

All external endpoints in v1 live under `/api/v1`.

### `GET /api/v1/me`

Required permission:

```ts
{ basic: ["read"] }
```

Returns metadata about the verified API principal:

- principal type: `user` or `organization`
- key id and config id
- non-secret key display data if available, such as `start`
- current accessible scope summary

Must not return the secret key value.

### `GET /api/v1/organizations`

Required permission:

```ts
{ organization: ["read"] }
```

Behavior:

- User key: return organizations where the owning user is currently a member.
- Organization key: return only the owning organization.

### `GET /api/v1/organizations/:organizationId`

Required permission:

```ts
{ organization: ["read"] }
```

Behavior:

- User key: allowed only when the owner is a current member of `organizationId`.
- Organization key: allowed only when `referenceId === organizationId`.

### `GET /api/v1/organizations/:organizationId/members`

Required permissions:

```ts
{ organization: ["read"], member: ["read"] }
```

Returns existing organization member DTO data. It must not include session tokens,
account tokens, or other secrets.

### `GET /api/v1/organizations/:organizationId/teams`

Required permissions:

```ts
{ organization: ["read"], team: ["read"] }
```

Returns existing workspace team list DTO data.

### `GET /api/v1/organizations/:organizationId/teams/:teamId/members`

Required permissions:

```ts
{ organization: ["read"], team: ["read"], teamMember: ["read"] }
```

Verifies the team belongs to the authorized organization before returning team members.

## Response Shape

Successful responses use:

```json
{
  "data": {}
}
```

Error responses use:

```json
{
  "error": {
    "code": "api_key_invalid",
    "message": "Invalid API key"
  }
}
```

Messages should be stable, user-facing English.

## Error Model

Use JSON errors only for `/api/v1`. Do not redirect and do not call
`next/navigation` helpers.

Status mapping:

- `401 api_key_missing`
  - No API key header.
- `401 api_key_invalid`
  - Better Auth verification failed, key is disabled, expired, exhausted, or malformed.
- `429 api_key_rate_limited`
  - Better Auth reports rate limit or usage exhaustion.
- `403 api_key_permission_denied`
  - Key is valid but lacks required resource/action permissions.
- `403 organization_access_denied`
  - User key owner is not a current member of the organization, or organization key
    targets a different organization.
- `404 resource_not_found`
  - Organization, team, or resource does not exist inside the already authorized scope.
- `400 invalid_request`
  - Invalid path, query, or body.
- `500 internal_error`
  - Unexpected server error. Log through the feature logger.

The wrapper should normalize Better Auth `verifyApiKey` results into typed errors.
Avoid leaking whether a foreign organization or team exists when the principal is not
authorized for that scope.

## Data Access

User-key organization reads can reuse existing membership-filtered repositories where
the user id is part of the function arguments and cache key.

Organization-key reads should use organization-scoped read functions that do not require
a fake user id. If existing repositories only support user-scoped membership checks, add
API-safe organization-scoped read functions with explicit DTO selects.

For team member routes, verify:

1. The principal is authorized for the organization path id.
2. The team exists inside that organization.
3. The key has `teamMember:read`.

Cached functions may use `"use cache"` only when all scope inputs are explicit function
arguments. Route handlers themselves must remain request-time handlers because they read
API key headers.

## Key Creation Boundary

The first implementation includes server-only creation wrappers for testability and
future UI integration, but it does not include key-management pages or forms. These
wrappers must not expose raw Better Auth server-only fields directly to client code.

Creation wrappers should:

- Accept a key type: user or organization.
- Accept allowlisted preset ids.
- Expand presets into Better Auth API key permissions.
- Validate that the acting user can manage organization keys before issuing org keys.
- Keep rate limit, remaining, refill, metadata, and other server-only fields controlled
  by the server.
- Return the secret key value only on successful creation.

## Tests

Add focused Jest tests first.

Permission tests:

- Built-in resources and actions are stable.
- Presets expand to expected Better Auth permission records.
- Unknown presets are rejected by wrapper validation.

Auth helper tests:

- Missing key returns `401 api_key_missing`.
- Invalid Better Auth result returns normalized `401 api_key_invalid`.
- Verified `user-keys` principal maps to `userId`.
- Verified `org-keys` principal maps to `organizationId`.
- Required permissions are passed to `auth.api.verifyApiKey`.

Organization access tests:

- User key is allowed only for organizations where the owner is a member.
- Organization key is allowed only for its own `referenceId`.
- Organization key cannot access another organization even with matching scopes.
- Team member endpoint verifies team ownership.

Route handler tests:

- Success for user key and organization key.
- `403` for scope mismatch.
- Stable `{ data: ... }` and `{ error: ... }` JSON shapes.

Config tests:

- Prisma schema includes the API key model mapped to `apikey`.
- Better Auth plugin config has `user-keys` and `org-keys`.
- Organization access control includes `apiKey` management statements.

Suggested verification commands:

```bash
npm run test -- --testPathPatterns=api-keys
npm run test -- --testPathPatterns=organizations
npm run lint
npm run build
```

## Extension Guidance

To add a future product API resource:

1. Add the resource/action pair to `api-keys-permissions.ts`.
2. Add a preset only if it is useful for UI or common integration setup.
3. Add a route handler under `/api/v1`.
4. Call the shared API key auth helper with the required permission record.
5. Resolve organization scope with the shared helper for organization-bound data.
6. Use repository functions that encode the principal scope in their arguments.
7. Return stable JSON DTOs and avoid leaking internal auth, session, or database fields.

This keeps API key authorization centralized while allowing product features to define
their own resources and data contracts.
