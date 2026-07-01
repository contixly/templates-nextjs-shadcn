# API Key Management UI Design

Date: 2026-06-29
Status: approved design

## Context

The template now has a Better Auth API Key foundation with two key families:

- `user-keys`, owned by `User.id`.
- `org-keys`, owned by `Organization.id`.

The previous API Key V1 design intentionally did not include key-management UI.
This design adds settings pages and reusable components for managing personal and
organization API keys while preserving the established principal model:

- A personal key acts as the owning user and can access organization data only
  through that user's current organization membership.
- An organization key acts as an organization principal and is scoped to its owning
  organization plus the key's API permissions.

Relevant project constraints:

- The app uses Next.js App Router with React Server Components and Cache Components.
- Pages and layouts are Server Components by default; interactive forms and row
  controls must be small Client Components.
- The settings UI uses `SettingsPageShell`, `SettingsPageIntro`, and
  `SettingsSection`.
- The shadcn/ui configuration is `radix-lyra`, RSC enabled, Tailwind v4, Tabler
  icons.
- Better Auth API key management supports `listApiKeys`, `createApiKey`,
  `updateApiKey`, and `deleteApiKey`.
- Better Auth treats permissions and rate-limit fields as server-only for direct
  client API requests, so this template must expose them through protected server
  actions only.

Docs and local sources consulted before design:

- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md`
- `node_modules/next/dist/docs/01-app/02-guides/forms.md`
- `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
- `npx shadcn@latest info --json`
- `npx shadcn@latest docs button dialog alert-dialog table field input select checkbox switch badge empty tooltip card drawer`
- `node_modules/@better-auth/api-key/dist/*`
- `docs/superpowers/specs/2026-06-27-api-key-v1-design.md`

## Goals

- Add separate key-management settings pages for personal and organization keys.
- Let users list, create, rename, enable, disable, update scopes, update expiration,
  update rate limits, and delete API keys.
- Show created key secrets exactly once with a copy affordance.
- Keep personal and organization key behavior clear to users through educational
  settings sections.
- Keep all key management authorization in server actions or server-only loaders.
- Make future API scopes and presets easy to extend from `api-keys-permissions.ts`.
- Preserve visual consistency with the existing settings, workspace, form, table, and
  dialog patterns.

## Non-Goals

- Do not add raw arbitrary permissions JSON editing in the first UI.
- Do not expose Better Auth secret `key` values after initial creation.
- Do not allow browser-session authentication on `/api/v1`.
- Do not make API keys behave like Better Auth sessions.
- Do not add a new visual language, landing page, or standalone integration area.
- Do not make organization keys inherit the creator's role after issue.

## Routes and Navigation

Add a personal API key page:

```text
/user/api-keys
```

Add an organization API key page:

```text
/w/[organizationKey]/settings/api-keys
```

Update route descriptors and sidebars:

- Add `api_keys` to `AccountsPages` in `accounts-routes.ts`.
- Add `settings_api_keys` to `WorkspaceSettingsPages` in `workspaces-routes.ts`.
- Add a matching item to `NavUserSettings`.
- Add a matching item to `NavWorkspaceSettings` only when the current user has
  `apiKey: ["read"]` for the organization.
- Use `IconKey` from `@tabler/icons-react` for both navigation entries.
- Add localized page metadata and sidebar labels in account and workspace message
  files.

The organization settings page must continue to canonicalize `organizationKey` by
redirecting to the canonical organization route key when needed.

## Architecture

Use one shared API key management UI slice and two thin page integrations.

Feature files:

- `src/features/api-keys/api-keys-types.ts`
  - Add list DTOs, editable field DTOs, and UI-safe types for rate limits,
    expiration, permissions, and status.
- `src/features/api-keys/api-keys-schemas.ts`
  - Zod schemas for create/update/delete inputs and localized form schemas.
- `src/features/api-keys/api-keys-permissions.ts`
  - Keep built-in resources, actions, and presets.
  - Add stable translation keys for preset labels and descriptions.
  - Continue to expose preset IDs as the safe public abstraction.
- `src/features/api-keys/api-keys-management.ts`
  - Server-only loaders that call Better Auth and return client-safe DTOs.
  - Personal loader lists `user-keys` for the current user.
  - Organization loader resolves the workspace context and lists `org-keys`.
- `src/features/api-keys/actions/`
  - `create-api-key.ts`, extended for expiration and rate-limit inputs.
  - `update-api-key.ts`.
  - `delete-api-key.ts`.
- `src/features/api-keys/components/`
  - Shared settings page sections and client controls.

App route files:

- `src/app/(protected)/(global)/user/api-keys/page.tsx`
- `src/app/(protected)/(global)/user/api-keys/opengraph-image.tsx`
- `src/app/(protected)/(global)/user/api-keys/twitter-image.ts`
- `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/page.tsx`
- `src/app/(protected)/(global)/w/[organizationKey]/settings/api-keys/workspace-settings-api-keys-content.tsx`
- matching Open Graph and Twitter image route files for the workspace page.

## Permission and Principal Rules

Personal keys:

- Any authenticated user may view and manage their own personal API keys.
- Personal keys are created with `configId: "user-keys"` and `referenceId` equal to
  the current user id.
- Personal keys use the same preset-based API permissions as organization keys.
- A personal key still needs current membership in an organization before it can read
  organization-scoped `/api/v1` resources for that organization.

Organization keys:

- The organization settings page is visible only when the current member has
  `apiKey: ["read"]`.
- Creation requires `apiKey: ["create"]`.
- Updating name, enabled state, scopes, expiration, and rate limits requires
  `apiKey: ["update"]`.
- Deletion requires `apiKey: ["delete"]`.
- Owners and admins have these permissions by default through the current Better Auth
  organization role config. Members do not.
- The creator's role only controls whether they can create or manage the key and
  which presets the UI permits. The issued key remains an organization principal.

Server actions must re-check all of these rules. Disabled buttons or hidden controls
are presentation only, not authorization.

## UI Design

Both pages use the same settings layout:

1. `SettingsPageIntro` with page title and description.
2. `SettingsSection` explaining personal versus organization keys.
3. `SettingsSection` containing the key table and create action.

The table section uses:

- Action button: `Create key`.
- A read-only notice when the user can read organization keys but cannot create,
  update, or delete them.
- `Table` for key rows.
- `Empty` for no keys.
- `Badge` for key status: active, disabled, expired.
- Row actions for edit, enable/disable, and delete.
- `AlertDialog` for deletion confirmation.

Recommended columns:

- Name.
- Key prefix/start.
- Scopes.
- Rate limit.
- Expiration.
- Last used.
- Created.
- Actions.

Responsive behavior should follow existing settings tables: stable dimensions,
wrapping text where needed, and no custom decorative cards inside settings sections.

## Education Blocks

Both pages include a `Personal vs organization keys` settings section before the
table.

The block explains:

- Personal keys act as the user who owns the key.
- Personal keys can read organization data only while the owner remains a member of
  that organization.
- Organization keys act as a separate organization principal.
- Organization keys are scoped to one organization and are not reduced when the
  creator later changes role or leaves.
- Both key types are additionally constrained by API scopes.
- Organization key management is limited to roles with `apiKey` permissions.

The organization key page also includes a visible link action to `/user/api-keys`,
for example `Manage personal keys`, so users discover the personal-key option from
the organization settings page.

The personal key page does not include an organization-specific link because there is
no single unambiguous target organization from the global user settings context.

## Forms and Dialogs

Create dialog fields:

- Name.
- Expiration:
  - Never.
  - 7 days.
  - 30 days.
  - 90 days.
  - 1 year.
- Rate limit enabled toggle.
- Rate limit max requests.
- Rate limit window:
  - 1 minute.
  - 1 hour.
  - 1 day.
- Preset checkbox list.
- Read-only permissions preview derived from selected presets.

Expiration choices map to Better Auth `expiresIn` seconds. `Never` sends `null`.
Updating expiration resets the expiry relative to the update time. Rate-limit windows
map to Better Auth `rateLimitTimeWindow` milliseconds.

After a successful create, the dialog switches to a one-time secret view:

- Read-only input containing the secret key.
- `CopyButton`.
- Warning copy that the secret will not be shown again.
- Actions to close or create another key.

Edit dialog fields:

- Name.
- Enabled state.
- Expiration with the same allowed choices, including clearing expiration.
- Rate limit enabled toggle.
- Rate limit max requests.
- Rate limit window.
- Preset checkbox list.
- Read-only permissions preview.

Edit does not display the secret.

Forms should use the existing project conventions:

- React Hook Form and Zod.
- `FieldGroup`, `Field`, `FieldLabel`, and `FieldMessage`.
- `FormErrorNotice` for action-level dialog errors.
- `LoadingButton` for submit pending state.
- `Modal` for desktop dialog and mobile drawer behavior unless a destructive
  confirmation requires `AlertDialog`.
- `toast` from `sonner` for successful mutations and row-action failures.

## Data Flow

Personal page:

1. Server page starts the key-list promise.
2. Server loader validates the current user.
3. Loader calls `auth.api.listApiKeys` with `configId: "user-keys"` and current
   request headers.
4. Loader maps Better Auth records to client-safe DTOs and omits `key`.
5. Client table receives DTOs and capability flags.

Organization page:

1. Server content resolves `organizationKey` to an accessible organization.
2. It redirects to the canonical route key if needed.
3. It checks `apiKey` management permissions.
4. Without `apiKey: ["read"]`, it uses `forbidden()`.
5. With read permission, it calls `auth.api.listApiKeys` with
   `configId: "org-keys"` and `organizationId`.
6. It maps Better Auth records to client-safe DTOs and capability flags.

Mutations:

1. Client dialog or row control calls a server action.
2. Action validates input with Zod.
3. Action resolves current user and required organization permissions.
4. Action calls Better Auth server API with server-only fields as needed.
5. Action returns only an `ActionResult` and the minimal UI-safe data.
6. Client shows toast, refreshes the router, and keeps one-time secret data only in
   component state after create.

## DTO and Secret Handling

List and update DTOs must never include the secret `key` field.

Allowed client-facing key fields:

- `id`.
- `configId`.
- `referenceId`.
- `name`.
- `start`.
- `prefix`.
- `enabled`.
- `permissions`.
- `rateLimitEnabled`.
- `rateLimitTimeWindow`.
- `rateLimitMax`.
- `requestCount`.
- `remaining`.
- `lastRequest`.
- `expiresAt`.
- `createdAt`.
- `updatedAt`.

Create action may return the secret `key` exactly once as part of the create result.
The table must use `start` or `prefix` for later identification.

## Error Handling

- Invalid forms show field-level errors through `FieldMessage`.
- Action-level form failures show `FormErrorNotice`.
- Row action failures show `toast.error`.
- Missing personal session calls `unauthorized()`.
- Missing organization read permission calls `forbidden()`.
- Organization keys that no longer exist return a stable not-found action error.
- No-op updates return a conflict-style action error instead of silently succeeding.
- Better Auth server-only field errors should be translated into stable template
  errors where they can be caused by UI input.

## Extensibility

Future template users should extend API key capabilities by editing
`api-keys-permissions.ts`:

- Add new resources and actions.
- Add route-level required permission records.
- Add preset definitions and translation keys.
- Add product API route handlers under `/api/v1`.

The UI should render preset options from the exported preset metadata so new product
presets do not require editing the table or dialogs.

The design intentionally excludes a raw permissions JSON editor. If a downstream
product needs one later, it should be added as an explicit advanced mode with its own
validation and tests.

## Testing Plan

Focused Jest coverage:

- Schemas reject invalid names, empty presets, invalid expiration choices, invalid
  rate-limit values, and no-op updates.
- Permission expansion and preset display metadata remain stable.
- DTO mappers omit the secret `key` from list/update responses.
- Personal loaders list only `user-keys`.
- Organization loaders require `apiKey: ["read"]` and list only `org-keys` for the
  resolved organization.
- Create action sends `permissions`, `expiresIn`, and rate-limit fields only from the
  server action.
- Update action requires ownership or organization `apiKey: ["update"]`.
- Delete action requires ownership or organization `apiKey: ["delete"]`.
- Components render empty, active, disabled, expired, read-only, and pending states.

Verification commands:

```bash
npm run test -- --testPathPatterns=api-keys
npm run lint
npm run build
```

Run narrower tests first during implementation, then run the full verification set
before completion.
