## MODIFIED Requirements

### Requirement: Workspace Route Redirects Only After Access Validation
The `/:organizationId` route MUST validate that the requested organization belongs to the current user before redirecting them to the organization dashboard.

#### Scenario: Accessible organization redirects to the organization dashboard

- **WHEN** an authenticated user opens `/:organizationId` for an organization they can access
- **THEN** the route validates access to that organization
- **AND** redirects the user to `/:organizationId/dashboard`

#### Scenario: Inaccessible organization renders the forbidden state

- **WHEN** an authenticated user opens `/:organizationId` for an organization that is not accessible to them
- **THEN** the route does not render a blank page
- **AND** renders the application's forbidden experience

### Requirement: Workspace Route Provides Route-Level Loading Feedback

The `/:organizationId` route MUST provide loading feedback through the App Router route-level loading convention.

#### Scenario: Organization route is loading

- **WHEN** the organization route is still resolving
- **THEN** the route shows loading UI from `loading.tsx`
- **AND** the page does not define its own full-route Suspense fallback
