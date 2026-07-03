# local-automation-auth Specification

## Purpose
Define the local-only Better Auth automation helper used by browser automation and end-to-end tests to create, sign in, and clean up temporary local users.

## Requirements
### Requirement: Local Automation Auth Is Explicitly Gated
The system MUST enable local automation authentication only outside production when `LOCAL_AUTOMATION_AUTH_ENABLED=true`.

#### Scenario: Feature flag enables local automation outside production
- **GIVEN** `NODE_ENV` is not `production`
- **AND** `LOCAL_AUTOMATION_AUTH_ENABLED` is `true`
- **WHEN** the system evaluates the local automation auth gate
- **THEN** local automation auth is enabled

#### Scenario: Production never enables local automation auth
- **GIVEN** `NODE_ENV` is `production`
- **AND** `LOCAL_AUTOMATION_AUTH_ENABLED` is `true`
- **WHEN** the system evaluates the local automation auth gate
- **THEN** local automation auth is disabled

#### Scenario: Missing explicit flag disables local automation auth
- **GIVEN** `NODE_ENV` is not `production`
- **AND** `LOCAL_AUTOMATION_AUTH_ENABLED` is not `true`
- **WHEN** the system evaluates the local automation auth gate
- **THEN** local automation auth is disabled

### Requirement: Login Page Shows Local Automation Controls Only When Enabled
The system SHALL render the local automation login panel on the login page only when local automation authentication is enabled.

#### Scenario: Local automation panel is visible when enabled
- **GIVEN** local automation authentication is enabled
- **WHEN** the login page renders
- **THEN** the page shows the regular login form
- **AND** the page shows the local automation panel

#### Scenario: Local automation panel is hidden when disabled
- **GIVEN** local automation authentication is disabled
- **WHEN** the login page renders
- **THEN** the page shows the regular login form
- **AND** the page does not show the local automation panel

### Requirement: Scenario Route Is Public But Feature-Guarded
The system SHALL keep `/api/local-auth/scenario` public at the proxy layer while guarding every scenario operation with the local automation feature gate.

#### Scenario: Proxy allows local automation API routing
- **GIVEN** a request targets `/api/local-auth/scenario`
- **WHEN** proxy route classification runs
- **THEN** the route is classified as a public API route

#### Scenario: Disabled scenario creation returns a stable envelope
- **GIVEN** local automation authentication is disabled
- **WHEN** a client posts to `/api/local-auth/scenario`
- **THEN** the response status is 404
- **AND** the response body is an error envelope with message `local_automation_auth_disabled` and code 404
- **AND** no Better Auth sign-up is attempted

#### Scenario: Disabled scenario cleanup returns a stable envelope
- **GIVEN** local automation authentication is disabled
- **WHEN** a client deletes `/api/local-auth/scenario`
- **THEN** the response status is 404
- **AND** the response body is an error envelope with message `local_automation_auth_disabled` and code 404
- **AND** no session lookup or Better Auth deletion is attempted

### Requirement: Scenario Creation Uses Strict Local Credentials
The system SHALL create local automation scenarios only from strict JSON request bodies and only with generated or explicit emails in the `local-agent+...@local-agent.test` namespace.

#### Scenario: Creating a generated local automation user
- **GIVEN** local automation authentication is enabled
- **AND** the request body is empty or contains valid strict JSON fields
- **WHEN** a client posts to `/api/local-auth/scenario` without an explicit email
- **THEN** the system generates a `local-agent+...@local-agent.test` email
- **AND** the system generates a local automation password
- **AND** the system calls Better Auth email/password sign-up with `rememberMe` enabled
- **AND** the response forwards the Better Auth session cookie
- **AND** the response status is 201
- **AND** the response body is a success envelope containing user, email, password, and cleanupUrl data

#### Scenario: Creating with an explicit local automation email
- **GIVEN** local automation authentication is enabled
- **AND** the request body contains an explicit email in the `local-agent+...@local-agent.test` namespace
- **WHEN** a client posts to `/api/local-auth/scenario`
- **THEN** the system uses that explicit email for Better Auth email/password sign-up
- **AND** the system does not accept emails outside the local automation namespace

#### Scenario: Invalid request body is rejected
- **GIVEN** local automation authentication is enabled
- **AND** the request body is malformed JSON or does not match the strict scenario body schema
- **WHEN** a client posts to `/api/local-auth/scenario`
- **THEN** the response status is 400
- **AND** the response body is an error envelope with message `local_automation_invalid_request` and code 400
- **AND** no Better Auth sign-up is attempted

#### Scenario: Disallowed explicit email is rejected
- **GIVEN** local automation authentication is enabled
- **AND** the request body contains an explicit email outside the `local-agent+...@local-agent.test` namespace
- **WHEN** a client posts to `/api/local-auth/scenario`
- **THEN** the response status is 400
- **AND** the response body is an error envelope with message `local_automation_email_required` and code 400
- **AND** no Better Auth sign-up is attempted

#### Scenario: Generated duplicate emails are retried
- **GIVEN** local automation authentication is enabled
- **AND** Better Auth reports duplicate generated email addresses
- **WHEN** a client posts to `/api/local-auth/scenario` without an explicit email
- **THEN** the system retries generated credentials up to three sign-up attempts
- **AND** a later successful attempt returns the credentials and session cookie from that successful attempt

#### Scenario: Explicit duplicate email returns conflict
- **GIVEN** local automation authentication is enabled
- **AND** the request body contains an explicit local automation email that already exists
- **WHEN** Better Auth reports the duplicate during sign-up
- **THEN** the response status is 409
- **AND** the response body is an error envelope with message `local_automation_user_exists` and code 409

#### Scenario: Sign-up failure returns server error
- **GIVEN** local automation authentication is enabled
- **AND** Better Auth fails sign-up for a reason other than a handled duplicate email
- **WHEN** a client posts to `/api/local-auth/scenario`
- **THEN** the response status is 500
- **AND** the response body is an error envelope with message `local_automation_sign_up_failed` and code 500

### Requirement: Scenario Cleanup Deletes Only The Current Automation User
The system SHALL clean up local automation scenarios only for an authenticated current session whose email is in the local automation namespace.

#### Scenario: Cleanup requires an authenticated session
- **GIVEN** local automation authentication is enabled
- **AND** the request has no valid Better Auth session
- **WHEN** a client deletes `/api/local-auth/scenario`
- **THEN** the response status is 401
- **AND** the response body is an error envelope with message `local_automation_session_required` and code 401
- **AND** no Better Auth user deletion is attempted

#### Scenario: Cleanup refuses non-automation users
- **GIVEN** local automation authentication is enabled
- **AND** the current Better Auth session belongs to an email outside the `local-agent+...@local-agent.test` namespace
- **WHEN** a client deletes `/api/local-auth/scenario`
- **THEN** the response status is 403
- **AND** the response body is an error envelope with message `local_automation_user_required` and code 403
- **AND** no Better Auth user deletion is attempted

#### Scenario: Cleanup deletes the automation user and memberless organizations
- **GIVEN** local automation authentication is enabled
- **AND** the current Better Auth session belongs to a local automation email
- **AND** the user is the sole member candidate for one or more organizations
- **WHEN** a client deletes `/api/local-auth/scenario`
- **THEN** the system calls Better Auth to delete the current user
- **AND** after Better Auth deletion succeeds, the system deletes only candidate organizations that are now memberless
- **AND** the system revalidates the root layout
- **AND** the response status is 200
- **AND** the response body is a success envelope containing the deletedOrganizations count

#### Scenario: Cleanup failure preserves organization candidates
- **GIVEN** local automation authentication is enabled
- **AND** the current Better Auth session belongs to a local automation email
- **AND** Better Auth fails current user deletion
- **WHEN** a client deletes `/api/local-auth/scenario`
- **THEN** the response status is 500
- **AND** the response body is an error envelope with message `local_automation_cleanup_failed` and code 500
- **AND** candidate organizations are not deleted
- **AND** the root layout is not revalidated
