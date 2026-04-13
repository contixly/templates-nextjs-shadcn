# Security

## Reporting a vulnerability

If you believe you have found a security issue in **this template repository** (documentation, example configuration, or bundled scripts), please report it responsibly:

- Prefer **private** communication: use GitHub **Security advisories** for this repository if available, or contact the maintainers through a channel they publish in the repo profile or organization readme.

Include:

- A short description of the issue and its impact.
- Steps to reproduce or a proof of concept.
- Affected files or areas, if known.

Please allow reasonable time for triage and a fix before public disclosure.

## Scope notes

Projects **generated from this template** are maintained by their owners. Security of deployed apps, secrets, OAuth configuration, and hosting is the responsibility of each project team.

## Recommendations for template users

- Never commit `.env`, `.env.local`, or real secrets.
- Rotate `BETTER_AUTH_SECRET` and OAuth client secrets if they are ever exposed.
- Keep dependencies updated and run `npm audit` as part of your own release process.
