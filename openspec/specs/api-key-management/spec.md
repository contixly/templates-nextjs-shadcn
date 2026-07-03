# api-key-management Specification

## Purpose
Define how authenticated users manage personal and organization API keys, including ownership, permissions, scopes, rate limits, expiration, and settings UI expectations.

## Requirements
### Requirement: API Key Families Are Separated
The system SHALL manage personal API keys and organization API keys as separate Better Auth API key configurations.

#### Scenario: Personal key configuration is user-owned
- **GIVEN** an authenticated user creates or lists personal API keys
- **WHEN** the system calls Better Auth API key management
- **THEN** it uses the `user-keys` configuration
- **AND** it associates the key reference with the current user id
- **AND** generated personal API keys use the `user_` prefix

#### Scenario: Organization key configuration is organization-owned
- **GIVEN** an authenticated user creates or lists organization API keys
- **WHEN** the system calls Better Auth API key management
- **THEN** it uses the `org-keys` configuration
- **AND** it associates the key reference with the target organization id
- **AND** generated organization API keys use the `org_` prefix

#### Scenario: Both key families use the same external header
- **GIVEN** an API key from either configured key family
- **WHEN** the key is used against the external API
- **THEN** the system accepts it from the `x-api-key` request header

### Requirement: Personal Key Settings Surface
The system SHALL expose a personal API key management page for every authenticated user.

#### Scenario: Authenticated user opens personal API keys
- **GIVEN** an authenticated user
- **WHEN** the user opens `/user/api-keys`
- **THEN** the system renders the personal API key settings page
- **AND** the page lists only API keys owned by the current user through the `user-keys` configuration
- **AND** the user can create, update, and delete their own personal keys

#### Scenario: Unauthenticated user opens personal API keys
- **GIVEN** no authenticated user session
- **WHEN** the visitor opens `/user/api-keys`
- **THEN** the system requires authentication before personal API key data is returned

### Requirement: Organization Key Settings Surface
The system SHALL expose an organization API key management page inside workspace settings only to members with organization API key read access.

#### Scenario: Member with read permission opens organization API keys
- **GIVEN** an authenticated member of an organization with `apiKey: ["read"]` permission
- **WHEN** the member opens `/w/[organizationKey]/settings/api-keys`
- **THEN** the system renders the organization API key settings page
- **AND** the page lists only API keys owned by that organization through the `org-keys` configuration

#### Scenario: Stale organization route key redirects to canonical settings path
- **GIVEN** an authenticated member opens organization API key settings with a stale or non-canonical organization route key
- **WHEN** the system resolves the workspace settings context
- **THEN** it redirects to `/w/[canonicalOrganizationKey]/settings/api-keys`
- **AND** after redirect, it loads organization API key management data for the resolved canonical organization

#### Scenario: Member without read permission opens organization API keys
- **GIVEN** an authenticated member of an organization without `apiKey: ["read"]` permission
- **WHEN** the member opens `/w/[organizationKey]/settings/api-keys`
- **THEN** the system denies access to the organization API key settings page

#### Scenario: Workspace navigation exposes organization API keys conditionally
- **GIVEN** an authenticated member can open workspace settings
- **WHEN** the workspace settings navigation is rendered
- **THEN** the API keys navigation item is shown only when the member has `apiKey: ["read"]` permission

### Requirement: Key Type Education Is Visible
The system SHALL explain the difference between personal and organization API keys on both key management pages.

#### Scenario: Personal page explains both key types
- **GIVEN** an authenticated user opens `/user/api-keys`
- **WHEN** the page renders
- **THEN** it explains that personal keys act as the owning user
- **AND** it explains that personal keys can access organization data only while the owner remains a member of the organization
- **AND** it explains that organization keys act as organization principals scoped to one organization

#### Scenario: Organization page explains both key types
- **GIVEN** an authenticated member opens `/w/[organizationKey]/settings/api-keys`
- **WHEN** the page renders
- **THEN** it explains that organization keys are scoped to the current organization
- **AND** it explains that organization keys are not reduced when the creator later changes role or leaves
- **AND** it explains that both key types are constrained by API scopes

#### Scenario: Organization page links to personal keys
- **GIVEN** an authenticated member opens the organization API key settings page
- **WHEN** the explanatory API key section renders
- **THEN** the page includes a visible link to `/user/api-keys`
- **AND** the link presents personal API keys as an available alternative to organization API keys

### Requirement: API Key Creation Uses Safe Server Actions
The system SHALL create API keys only through protected server actions that validate input, authorize ownership, and pass server-controlled fields to Better Auth.

#### Scenario: Create form uses owner-specific defaults
- **GIVEN** an authenticated user opens a create API key form
- **WHEN** the form is initialized for personal API keys
- **THEN** it defaults permission presets to `basic-read`
- **AND** it defaults expiration to `30d`
- **AND** it defaults rate limiting to enabled with max `1000` and window `1h`

#### Scenario: Organization create form uses organization defaults
- **GIVEN** an authenticated member opens a create API key form for an organization
- **WHEN** the form is initialized for organization API keys
- **THEN** it defaults permission presets to `organization-read-all`
- **AND** it defaults expiration to `30d`
- **AND** it defaults rate limiting to enabled with max `1000` and window `1h`

#### Scenario: Personal API key is created
- **GIVEN** an authenticated user submits a valid personal API key create form
- **WHEN** the server action creates the key
- **THEN** it validates the form input
- **AND** it uses `user-keys` with the current user id as the key reference
- **AND** it expands selected permission presets into stored API key permissions
- **AND** it applies the selected expiration and rate-limit settings
- **AND** it revalidates `/user/api-keys`

#### Scenario: Organization API key is created by an authorized member
- **GIVEN** an authenticated member has `apiKey: ["create"]` permission for an organization
- **WHEN** the member submits a valid organization API key create form
- **THEN** the server action uses `org-keys` with the organization id as the key reference
- **AND** it expands selected permission presets into stored API key permissions
- **AND** it applies the selected expiration and rate-limit settings
- **AND** it revalidates the organization API key settings path

#### Scenario: Organization API key creation is denied without permission
- **GIVEN** an authenticated member does not have `apiKey: ["create"]` permission for an organization
- **WHEN** the member submits an organization API key create form
- **THEN** the server action returns a forbidden action result
- **AND** no organization API key is created

#### Scenario: Newly created secret is shown once
- **GIVEN** an API key is created successfully
- **WHEN** the create action returns to the client
- **THEN** the response includes the generated secret key value exactly for that create flow
- **AND** list and update flows do not expose the secret key value

### Requirement: Management Forms Enforce Concrete Validation
The system SHALL validate API key management form input with concrete field boundaries before calling Better Auth mutations.

#### Scenario: Name validation trims input
- **GIVEN** a user submits an API key create or update form with a name value
- **WHEN** the system validates the form input
- **THEN** it trims the name
- **AND** it requires at least one non-whitespace character
- **AND** it rejects names longer than 32 characters

#### Scenario: Permission preset validation protects stored scopes
- **GIVEN** a user submits an API key create form or submits an update that replaces permission presets
- **WHEN** the system validates the selected permission preset ids
- **THEN** it requires at least one preset id
- **AND** it rejects preset ids outside the configured API key permission presets
- **AND** it does not persist any permission changes when preset validation fails

#### Scenario: Expiration validation allows only configured options
- **GIVEN** a user submits an API key create form or an update with an expiration value
- **WHEN** the system validates the expiration
- **THEN** it accepts only `never`, `7d`, `30d`, `90d`, or `365d`
- **AND** it rejects any other expiration value

#### Scenario: Rate-limit validation enforces configured bounds
- **GIVEN** a user submits an API key create form or an update with rate-limit values
- **WHEN** the system validates the rate-limit settings
- **THEN** it accepts only `1m`, `1h`, or `1d` as the rate-limit window
- **AND** it requires the rate-limit max to be an integer from 1 through 1,000,000
- **AND** it rejects any rate-limit setting outside those bounds

#### Scenario: Owner context validation separates personal and organization forms
- **GIVEN** a user submits an API key create, update, or delete form
- **WHEN** the form type is `organization`
- **THEN** the system requires `organizationId`
- **AND** organization authorization is evaluated against that organization id
- **AND** the mutation is not attempted when `organizationId` is absent or invalid

#### Scenario: Personal forms reject organization context
- **GIVEN** a user submits an API key create, update, or delete form
- **WHEN** the form type is `user`
- **THEN** the system rejects any supplied `organizationId`
- **AND** it rejects any supplied `organizationKey`
- **AND** the mutation is not attempted with organization context

#### Scenario: Update requests include at least one changed field
- **GIVEN** a user submits an API key update request
- **WHEN** the request contains no update field for name, presets, expiration, rate-limit settings, or enabled state
- **THEN** the system rejects the request
- **AND** no API key update is attempted

### Requirement: API Key Updates Are Authorized And Validated
The system SHALL update API key metadata, enabled state, scopes, expiration, and rate-limit settings only through protected server actions.

#### Scenario: Personal API key is updated
- **GIVEN** an authenticated user submits a valid update for one of their personal API keys
- **WHEN** the server action updates the key
- **THEN** it validates at least one update value
- **AND** it uses the `user-keys` configuration
- **AND** it revalidates `/user/api-keys`

#### Scenario: Organization API key is updated by an authorized member
- **GIVEN** an authenticated member has `apiKey: ["update"]` permission for an organization
- **WHEN** the member updates an organization API key
- **THEN** the server action uses the `org-keys` configuration
- **AND** it applies only validated fields
- **AND** it revalidates the organization API key settings path

#### Scenario: Organization API key update is denied without permission
- **GIVEN** an authenticated member does not have `apiKey: ["update"]` permission for an organization
- **WHEN** the member submits an organization API key update
- **THEN** the server action returns a forbidden action result
- **AND** no organization API key is updated

#### Scenario: Custom permissions are preserved during unrelated edits
- **GIVEN** an existing API key has stored permissions that do not exactly match built-in permission presets
- **WHEN** a user updates an unrelated field such as the key name or enabled state
- **THEN** the system preserves the stored permissions
- **AND** the update request does not replace the permissions with built-in presets

#### Scenario: Expiration renewal is explicit
- **GIVEN** an existing API key has an expiration duration shown in the edit form
- **WHEN** a user saves the key without changing expiration and without enabling explicit renewal
- **THEN** the system does not renew the key expiration

#### Scenario: Expiration can be renewed to the displayed duration
- **GIVEN** an existing API key has an expiration duration shown in the edit form
- **WHEN** a user enables explicit expiration renewal and saves the key
- **THEN** the system renews the key expiration to the selected displayed duration from the save time

### Requirement: API Key Deletion Is Authorized
The system SHALL delete API keys only through protected server actions that enforce the relevant owner and organization permissions.

#### Scenario: Personal API key is deleted
- **GIVEN** an authenticated user confirms deletion of one of their personal API keys
- **WHEN** the server action deletes the key
- **THEN** it uses the `user-keys` configuration
- **AND** it revalidates `/user/api-keys`

#### Scenario: Organization API key is deleted by an authorized member
- **GIVEN** an authenticated member has `apiKey: ["delete"]` permission for an organization
- **WHEN** the member confirms deletion of an organization API key
- **THEN** the server action uses the `org-keys` configuration
- **AND** it revalidates the organization API key settings path

#### Scenario: Organization API key deletion is denied without permission
- **GIVEN** an authenticated member does not have `apiKey: ["delete"]` permission for an organization
- **WHEN** the member confirms deletion of an organization API key
- **THEN** the server action returns a forbidden action result
- **AND** no organization API key is deleted

#### Scenario: Personal API keys are revoked when the owner is deleted
- **GIVEN** a user owns personal API keys through the `user-keys` configuration
- **WHEN** that user account is deleted
- **THEN** the system deletes API keys whose reference is that user id
- **AND** those personal keys can no longer authenticate `/api/v1` requests

#### Scenario: Organization API keys are revoked when the organization is deleted
- **GIVEN** an organization owns API keys through the `org-keys` configuration
- **WHEN** that organization is deleted
- **THEN** the system deletes API keys whose reference is that organization id
- **AND** those organization keys can no longer authenticate `/api/v1` requests

### Requirement: Permission Presets Remain Extensible
The system SHALL expose API key permissions to users through safe presets while storing permissions as an extensible resource/action record.

#### Scenario: Presets expand to API key permissions
- **GIVEN** a create or update form contains valid preset ids
- **WHEN** the server action processes the form
- **THEN** the system expands the presets into a `Record<string, string[]>` permission object
- **AND** the stored permission object is the source of truth for external API access

#### Scenario: Unknown preset is rejected
- **GIVEN** a create or update form contains an unknown preset id
- **WHEN** the server action validates the form
- **THEN** the action returns a validation error
- **AND** no API key permission changes are persisted

#### Scenario: Product developers extend key permissions
- **GIVEN** a product built from the template needs a new external API resource or action
- **WHEN** the developer adds a resource/action and optional presets to the API key permissions module
- **THEN** new route handlers can require those permissions without changing the personal versus organization key principal model
