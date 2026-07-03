# account-session-management Specification

## Purpose
Define the security requirements for listing and revoking current-user sessions from the account security settings surface.

## Requirements
### Requirement: Account Security Lists Safe Session Metadata
The system MUST render `/user/security` active session metadata without serializing raw Better Auth session tokens or other bearer-like secrets to Client Components.

#### Scenario: Security page lists sessions with safe identifiers only
- **GIVEN** an authenticated user has one or more active sessions
- **WHEN** the user opens `/user/security`
- **THEN** the system lists active sessions with device metadata, timestamps, IP address, and current-session state
- **AND** the client payload contains only opaque session IDs needed for UI actions
- **AND** the client payload does not contain raw session tokens

### Requirement: Single Session Revocation Resolves Tokens Server-Side
The system SHALL revoke a non-current session only after the server verifies ownership of the submitted opaque session ID and resolves the raw Better Auth session token internally.

#### Scenario: Revoking another session resolves the token server-side
- **GIVEN** an authenticated user has another active session listed on `/user/security`
- **WHEN** the user revokes that other session from the security page
- **THEN** the client submits only that session's opaque session ID
- **AND** the server verifies that the session belongs to the current user
- **AND** the server resolves the raw session token internally before calling the authentication provider
- **AND** the server revalidates `/user/security` after the revocation succeeds

#### Scenario: Current session is rejected by the single-session action
- **GIVEN** an authenticated user submits the opaque ID of the current session to the single-session revoke action
- **WHEN** the action validates the request
- **THEN** the action returns a 409 conflict result
- **AND** the action does not call the authentication provider to revoke a session

### Requirement: Revoke All Preserves The Current Session
The system SHALL revoke every other active session for the current user while preserving the session that initiated the request.

#### Scenario: Revoke all signs out every other active session
- **GIVEN** an authenticated user has a current session and one or more other active sessions
- **WHEN** the user revokes all other sessions from `/user/security`
- **THEN** the server excludes the current session from the revocation set
- **AND** the server calls the authentication provider for each other session token
- **AND** the current session remains active
- **AND** the server revalidates `/user/security` after the bulk revocation succeeds

### Requirement: Protected Actions Validate Authenticated Session Server-Side
Server actions that require authentication MUST derive the actor from a validated session lookup inside the action boundary rather than trusting client-supplied request headers.

#### Scenario: Forged user header is ignored by protected actions
- **GIVEN** a request to a protected server action includes a forged user-id header
- **WHEN** the action determines the authenticated actor
- **THEN** the action ignores that header as an authentication source
- **AND** authorizes the operation only from the current validated session
