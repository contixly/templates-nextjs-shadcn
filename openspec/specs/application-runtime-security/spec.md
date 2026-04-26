# application-runtime-security Specification

## Purpose
Define production runtime configuration and browser-facing security controls that protect generated links, optimized media, and rendered pages.

## Requirements
### Requirement: Public Application Base URL Is Environment-Driven
The system MUST build absolute public URLs from explicit runtime configuration and MUST NOT use placeholder production domains.

#### Scenario: Production requires a configured public base URL
- **WHEN** the application starts in production
- **THEN** a public application base URL is required from environment configuration
- **AND** generated metadata, sitemap entries, robots links, and workspace invitation links use that configured URL
- **AND** generated URLs do not fall back to `example.com`

### Requirement: Image Optimization Uses A Strict Remote Host Policy
The system MUST NOT configure the Next.js image optimizer to fetch arbitrary remote HTTPS hosts.

#### Scenario: Arbitrary remote image host is not allowed
- **WHEN** a user-controlled URL is passed to the Next.js image optimizer
- **THEN** the optimizer allows only explicitly configured remote hosts
- **AND** a wildcard host pattern for all HTTPS domains is not present

### Requirement: Browser Security Headers Are Set Globally
The system MUST set baseline browser security response headers for application routes.

#### Scenario: Application route includes baseline security headers
- **WHEN** the application serves a page or API route
- **THEN** the response includes content-type sniffing protection, clickjacking protection, a strict referrer policy, restricted permissions policy, and a baseline content security policy for framing and object/embed restrictions
- **AND** production responses include HSTS
