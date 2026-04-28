## ADDED Requirements

### Requirement: Workspace Invitations Support Optional Team Assignment
The system MUST allow authorized workspace invitation workflows to target an optional Better Auth team within the
invited workspace organization.

#### Scenario: Authorized member can select a team while creating an invitation
- **WHEN** a workspace member with `invitation:create` permission opens the create-invitation modal for a workspace with
  existing teams
- **THEN** the modal allows the member to leave team assignment empty or select one team from the current workspace
- **AND** does not show teams from another workspace organization

#### Scenario: Invitation without team target remains workspace-only
- **WHEN** an authorized workspace member submits a valid invitation without selecting a team
- **THEN** the system creates a pending workspace invitation without a team target
- **AND** acceptance grants workspace organization membership according to the existing invitation behavior

#### Scenario: Invitation with team target stores team ID
- **WHEN** an authorized workspace member submits a valid invitation with a selected team from the same workspace
  organization
- **THEN** the system creates a pending invitation with that team target
- **AND** the invitation list and invitation decision surface identify the target team

#### Scenario: Invitation with invalid team target is rejected
- **WHEN** an authorized workspace member submits an invitation with a team ID that does not exist or does not belong to
  the invited workspace organization
- **THEN** the system rejects the invitation request
- **AND** does not create a pending invitation

#### Scenario: Accepting a team-targeted invitation joins the team
- **WHEN** an eligible authenticated user accepts an actionable invitation that targets an existing team in the invited
  workspace
- **THEN** the system grants workspace organization membership with the invited role
- **AND** adds the user to the targeted team
- **AND** updates active workspace context to the invited workspace organization

#### Scenario: Personal invitation list shows team target when present
- **WHEN** an authenticated user reviews pending invitations addressed to their primary account email
- **AND** one of those invitations targets a team
- **THEN** the system renders the target team name with that invitation
- **AND** still allows the user to open the dedicated invitation decision route
