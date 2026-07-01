# api-v1-api-key-access Specification

## Purpose
Define the external `/api/v1` API key authentication boundary, principal model, organization access rules, permission checks, and starter read endpoints.

## Requirements
### Requirement: API V1 Uses API Key Authentication
The system SHALL authenticate `/api/v1` route handlers with API keys rather than browser session cookies.

#### Scenario: Valid API key authenticates a request
- **GIVEN** a request to a `/api/v1` route includes a valid API key in the `x-api-key` header
- **WHEN** the route handler verifies the key
- **THEN** the system resolves an explicit API key principal
- **AND** the route handler authorizes the request against that principal

#### Scenario: Missing API key is rejected
- **GIVEN** a request to a `/api/v1` route does not include `x-api-key`
- **WHEN** the route handler verifies the request
- **THEN** the system returns an unauthorized API error with code `api_key_missing`

#### Scenario: Invalid API key is rejected
- **GIVEN** a request to a `/api/v1` route includes an invalid API key
- **WHEN** the route handler verifies the request
- **THEN** the system returns an unauthorized API error with code `api_key_invalid`

#### Scenario: Rate-limited API key is rejected
- **GIVEN** a request to a `/api/v1` route includes a valid API key that has exceeded its configured rate limit
- **WHEN** the route handler verifies the key
- **THEN** the system returns a too-many-requests API error with code `api_key_rate_limited`

### Requirement: API Key Principal Model Is Explicit
The system SHALL resolve verified API keys into either a user principal or an organization principal.

#### Scenario: Personal key resolves to user principal
- **GIVEN** a verified API key belongs to the `user-keys` configuration
- **WHEN** the system builds the API principal
- **THEN** the principal type is `user`
- **AND** the principal contains the key id, key start, config id, user id, and stored permissions

#### Scenario: Organization key resolves to organization principal
- **GIVEN** a verified API key belongs to the `org-keys` configuration
- **WHEN** the system builds the API principal
- **THEN** the principal type is `organization`
- **AND** the principal contains the key id, key start, config id, organization id, and stored permissions

#### Scenario: API key is not treated as browser session
- **GIVEN** a request is authenticated with an API key
- **WHEN** route code handles the request
- **THEN** authorization decisions are made from the API key principal
- **AND** active browser organization session state is not used to determine API key access

### Requirement: Personal Keys Use User Membership For Organization Access
The system SHALL allow a personal API key to access organization-scoped `/api/v1` data only when the owning user is a current member of the organization in the path.

#### Scenario: Personal key accesses member organization
- **GIVEN** a personal API key belongs to a user who is a current member of an organization
- **WHEN** the key requests an organization-scoped `/api/v1` route for that organization id
- **THEN** the system grants organization scope after the required API key permission check passes

#### Scenario: Personal key is denied for non-member organization
- **GIVEN** a personal API key belongs to a user who is not a current member of an organization
- **WHEN** the key requests an organization-scoped `/api/v1` route for that organization id
- **THEN** the system returns a forbidden API error with code `organization_access_denied`

#### Scenario: Personal key organization context is path-based
- **GIVEN** a personal API key requests an organization-scoped `/api/v1` route
- **WHEN** the route resolves organization scope
- **THEN** the organization id is taken from the route path
- **AND** no active organization session or organization header is required for the v1 contract

### Requirement: Organization Keys Use Organization Principal Access
The system SHALL allow an organization API key to access only data for its owning organization as an organization principal.

#### Scenario: Organization key accesses owning organization
- **GIVEN** an organization API key belongs to an organization
- **WHEN** the key requests an organization-scoped `/api/v1` route for the same organization id
- **THEN** the system grants organization scope after the required API key permission check passes

#### Scenario: Organization key is denied for another organization
- **GIVEN** an organization API key belongs to one organization
- **WHEN** the key requests an organization-scoped `/api/v1` route for a different organization id
- **THEN** the system returns a forbidden API error with code `organization_access_denied`

#### Scenario: Creator role does not limit issued organization key access
- **GIVEN** an organization API key was created by an authorized organization member
- **WHEN** the creator later changes role or leaves the organization
- **THEN** the key continues to act as an organization principal until it is disabled, expired, deleted, rate-limited, or lacks required API permissions
- **AND** creator role is relevant only for key management actions and allowed scope selection

#### Scenario: Deleted organization key cannot authenticate
- **GIVEN** an organization API key belongs to an organization
- **WHEN** the organization is deleted
- **THEN** the key no longer authenticates `/api/v1` requests

### Requirement: API Key Permissions Gate Route Access
The system SHALL require every `/api/v1` route handler to verify the API key with the route's required resource/action permissions.

#### Scenario: Required permission is present
- **GIVEN** an API key has the permissions required by a route handler
- **WHEN** the key requests that route
- **THEN** the system continues to principal-specific authorization

#### Scenario: Required permission is missing
- **GIVEN** an API key does not have the permissions required by a route handler
- **WHEN** the key requests that route
- **THEN** the system returns a forbidden API error with code `api_key_permission_denied`

#### Scenario: Product route requires custom permission
- **GIVEN** a product built from the template adds a new `/api/v1` resource
- **WHEN** the route handler defines a required permission record for that resource
- **THEN** the shared API key verifier can enforce the permission without changing the key principal model

### Requirement: Starter API V1 Endpoints Expose Read-Only Organization Data
The system SHALL provide starter read-only `/api/v1` endpoints that prove the API key principal and organization access model.

#### Scenario: API key principal metadata is returned
- **GIVEN** an API key has `{ basic: ["read"] }` permission
- **WHEN** it sends `GET /api/v1/me`
- **THEN** the system returns the principal type, non-secret key metadata, and stored permissions
- **AND** the response does not include the API key secret value

#### Scenario: Accessible organizations are returned
- **GIVEN** an API key has `{ organization: ["read"] }` permission
- **WHEN** it sends `GET /api/v1/organizations`
- **THEN** a personal key receives organizations where the owning user is a current member
- **AND** an organization key receives only its owning organization

#### Scenario: Organization details are returned
- **GIVEN** an API key has `{ organization: ["read"] }` permission
- **WHEN** it sends `GET /api/v1/organizations/[organizationId]`
- **THEN** the system returns that organization only after principal-specific organization access succeeds

#### Scenario: Organization members are returned
- **GIVEN** an API key has `{ organization: ["read"], member: ["read"] }` permission
- **WHEN** it sends `GET /api/v1/organizations/[organizationId]/members`
- **THEN** the system returns organization members only after principal-specific organization access succeeds

#### Scenario: Organization teams are returned
- **GIVEN** an API key has `{ organization: ["read"], team: ["read"] }` permission
- **WHEN** it sends `GET /api/v1/organizations/[organizationId]/teams`
- **THEN** the system returns organization teams only after principal-specific organization access succeeds

#### Scenario: Organization team members are returned
- **GIVEN** an API key has `{ organization: ["read"], team: ["read"], teamMember: ["read"] }` permission
- **WHEN** it sends `GET /api/v1/organizations/[organizationId]/teams/[teamId]/members`
- **THEN** the system returns team members only after the team exists in that organization and principal-specific organization access succeeds

### Requirement: API V1 Returns Stable JSON Envelopes
The system SHALL return stable JSON envelopes for successful `/api/v1` responses and API key errors.

#### Scenario: Successful response envelope
- **GIVEN** an authenticated and authorized API key request succeeds
- **WHEN** the route handler returns data
- **THEN** the response body is wrapped in a top-level `data` field

#### Scenario: API error response envelope
- **GIVEN** an API key request fails with a handled API key error
- **WHEN** the route handler returns the error
- **THEN** the response body contains a top-level `error` object
- **AND** the error object includes stable `code` and `message` fields

#### Scenario: Missing resource does not leak unauthorized data
- **GIVEN** an API key has passed authentication and principal-specific access for a route
- **WHEN** the requested organization or team resource does not exist
- **THEN** the system returns a not-found API error with code `resource_not_found`
