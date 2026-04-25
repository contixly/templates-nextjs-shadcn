# account-session-management Specification

## Purpose
Define the security requirements for listing and revoking current-user sessions from the account security settings surface.

## Requirements
### Requirement: Account Session Lists Do Not Expose Bearer Secrets
The system MUST render active session metadata without serializing raw Better Auth session tokens or other bearer-like secrets to Client Components.

#### Scenario: Security page lists sessions with safe identifiers only
- **WHEN** an authenticated user opens the account security page
- **THEN** the system lists active sessions with device metadata, timestamps, IP address, and current-session state
- **AND** the client payload contains only opaque session IDs needed for UI actions
- **AND** the client payload does not contain raw session tokens

#### Scenario: Revoking another session resolves the token server-side
- **WHEN** an authenticated user revokes another active session from the security page
- **THEN** the client submits only that session's opaque session ID
- **AND** the server verifies that the session belongs to the current user
- **AND** the server resolves the raw session token internally before calling the authentication provider

### Requirement: Protected Actions Validate Authenticated Session Server-Side
Server actions that require authentication MUST derive the actor from a validated session lookup inside the action boundary rather than trusting client-supplied request headers.

#### Scenario: Forged user header is ignored by protected actions
- **WHEN** a request to a protected server action includes a forged user-id header
- **THEN** the action ignores that header as an authentication source
- **AND** authorizes the operation only from the current validated session
