# account-settings-management Specification

## Purpose
Define the current-user account settings routes, navigation, profile editing, social provider connections, and destructive account deletion behavior.

## Requirements
### Requirement: User Settings Root Redirects To Profile
The system SHALL route the current-user settings root to the profile settings page.

#### Scenario: Opening the user settings root
- **GIVEN** an authenticated user can access account settings
- **WHEN** the user opens `/user`
- **THEN** the system redirects the request to `/user/profile`

### Requirement: User Settings Navigation Exposes Account Sections
The system SHALL expose the profile, invitations, connections, security, personal API keys, and danger account settings sections in the user settings navigation.

#### Scenario: Rendering the user settings navigation
- **GIVEN** an authenticated user is viewing a user settings page
- **WHEN** the settings navigation renders
- **THEN** it includes navigation items for profile, invitations, connections, security, personal API keys, and danger
- **AND** each item links to its configured account settings route
- **AND** the danger navigation item is visually marked as destructive when it is not the active item

### Requirement: Profile Page Separates Account Identity Sections
The system SHALL render the profile settings page with account identity details grouped into separate settings sections.

#### Scenario: Opening profile settings
- **GIVEN** an authenticated user has an account profile
- **WHEN** the user opens `/user/profile`
- **THEN** the page renders profile context before editable or data-bearing sections
- **AND** it renders sections for avatar, display name, email address, user ID, and member since
- **AND** the email address is displayed as read-only account data
- **AND** the user ID is displayed as read-only account metadata

### Requirement: Display Name Updates Use Protected Validation
The system SHALL update the profile display name only through a protected server action that validates and trims the submitted name.

#### Scenario: Updating the display name successfully
- **GIVEN** an authenticated user submits a display name that is 2 to 50 characters after trimming
- **WHEN** the display name update action runs
- **THEN** the action trims the submitted name before mutation
- **AND** the action updates the current Better Auth user through the protected server action boundary
- **AND** the action returns the updated user profile
- **AND** the profile form resets to the returned display name on success

#### Scenario: Rejecting an invalid display name
- **GIVEN** an authenticated user submits a display name shorter than 2 characters or longer than 50 characters after trimming
- **WHEN** the display name update is validated
- **THEN** the system returns a validation or action error
- **AND** the display name is not updated

### Requirement: Connections Page Manages Configured Social Providers
The system SHALL list configured social providers and expose link or unlink controls according to current account state and last-used login method.

#### Scenario: Listing configured providers
- **GIVEN** the application has one or more configured social providers
- **WHEN** an authenticated user opens `/user/connections`
- **THEN** the page lists each configured provider
- **AND** each provider is marked as connected or not connected for the current user
- **AND** the provider matching the last login method is marked as the last-used method

#### Scenario: Linking an unconnected configured provider
- **GIVEN** a configured social provider is not linked to the current user
- **WHEN** the user chooses to connect that provider
- **THEN** the client starts the provider-specific Better Auth link flow
- **AND** the link callback returns the user to `/user/connections`

#### Scenario: Unlinking requires a safe alternate provider
- **GIVEN** a configured provider is linked to the current user
- **WHEN** the connections page renders its unlink control
- **THEN** the system enables unlinking only when more than one configured provider is linked
- **AND** the system disables unlinking when the provider is the last-used login method

### Requirement: Danger Page Deletes Accounts Destructively
The system SHALL expose account deletion as a destructive account settings section that requires matching email confirmation before deletion.

#### Scenario: Opening the danger page
- **GIVEN** an authenticated user has an account email
- **WHEN** the user opens `/user/danger`
- **THEN** the page renders account deletion inside a destructive settings section
- **AND** the delete confirmation dialog requires the user to enter the account email

#### Scenario: Deleting with matching email confirmation
- **GIVEN** an authenticated user enters an email confirmation matching the current account email
- **WHEN** the user submits account deletion
- **THEN** the protected delete action calls Better Auth to delete the current user
- **AND** the action signs out the current session after deletion
- **AND** the client routes the user to the home page on success

#### Scenario: Rejecting mismatched email confirmation
- **GIVEN** an authenticated user enters an email confirmation that does not match the current account email
- **WHEN** the user submits account deletion
- **THEN** the system returns a validation or action error
- **AND** Better Auth account deletion is not called
- **AND** the user remains on the account deletion flow
