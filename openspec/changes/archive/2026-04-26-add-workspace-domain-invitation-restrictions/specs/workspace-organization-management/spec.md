## ADDED Requirements

### Requirement: Workspace Settings Support Email Domain Restrictions
The system MUST let any accessible workspace member view the workspace's allowed email-domain restrictions, while only
members with organization-update permission can configure zero or more exact email domains. An empty domain list MUST
disable domain restrictions for that workspace.

#### Scenario: Regular member sees domain restrictions in read-only mode
- **WHEN** an authenticated workspace member without organization-update permission opens the dedicated workspace
  settings page for an accessible workspace
- **THEN** the system loads the current allowed email-domain restrictions
- **AND** renders them in a read-only presentation
- **AND** does not expose a working submit path for changing domain restrictions

#### Scenario: Authorized workspace admin saves allowed domains
- **WHEN** an authenticated workspace member with organization-update permission submits valid allowed email domains
  from the dedicated workspace settings page
- **THEN** the system stores the normalized, deduplicated domains for the underlying organization
- **AND** refreshes affected workspace settings and member-list cache entries

#### Scenario: Clearing all allowed domains disables restrictions
- **WHEN** an authenticated workspace member with organization-update permission saves an empty allowed-domain list
- **THEN** the system stores no active allowed-domain restrictions for the workspace
- **AND** subsequent invitation and direct-add eligibility checks treat the workspace as unrestricted by email domain

#### Scenario: Invalid allowed domain input is rejected
- **WHEN** an authenticated workspace member with organization-update permission submits a value that is not a valid
  email domain name
- **THEN** the system rejects the update
- **AND** leaves the previously configured allowed domains unchanged

#### Scenario: Unauthorized direct restriction update is rejected
- **WHEN** an authenticated workspace member without organization-update permission submits a workspace-settings update
  request that changes allowed email-domain restrictions directly
- **THEN** the system rejects the mutation
- **AND** leaves the underlying organization restrictions unchanged
