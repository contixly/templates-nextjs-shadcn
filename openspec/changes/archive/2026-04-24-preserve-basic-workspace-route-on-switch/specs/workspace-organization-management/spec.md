## MODIFIED Requirements

### Requirement: Workspace Switching Is Explicit
The system MUST update active workspace context only through explicit user actions in workspace switching controls or settings, and workspace switching controls MUST preserve equivalent base workspace routes when the current route can be safely transferred to the selected workspace.

#### Scenario: Sidebar switcher changes active workspace and preserves a base workspace route
- **WHEN** an authenticated user is viewing a registered organization-scoped route whose only dynamic route segment is `organizationKey`
- **AND** the user selects another accessible workspace in the sidebar switcher
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to the same route path under the selected workspace's slug-preferred `organizationKey`

#### Scenario: Breadcrumb switcher changes active workspace and preserves a base workspace route
- **WHEN** an authenticated user is viewing a registered organization-scoped route whose only dynamic route segment is `organizationKey`
- **AND** the user selects another accessible workspace in the breadcrumb workspace switcher
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to the same route path under the selected workspace's slug-preferred `organizationKey`

#### Scenario: Workspace switching falls back for complex organization-scoped routes
- **WHEN** an authenticated user is viewing an organization-scoped route that has any dynamic route segment other than `organizationKey`
- **AND** the user selects another accessible workspace in a workspace switching control
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to `/:organizationKey/dashboard` using the selected workspace slug when available

#### Scenario: Workspace switching falls back for unknown routes
- **WHEN** an authenticated user is viewing a route that is not registered as a base organization-scoped page
- **AND** the user selects another accessible workspace in a workspace switching control
- **THEN** the system updates `session.activeOrganizationId` to that workspace's organization id
- **AND** navigates the user to `/:organizationKey/dashboard` using the selected workspace slug when available

#### Scenario: Current workspace label follows URL context
- **WHEN** an authenticated user is viewing `/:organizationKey/...`
- **THEN** workspace switching controls label the current workspace using the accessible organization whose slug or ID matches that route key
- **AND** do not label a different workspace just because `session.activeOrganizationId` points elsewhere
