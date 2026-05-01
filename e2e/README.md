# End-to-End Tests

Playwright scenarios live under `e2e/`.

## Setup

Install the Chromium browser before the first local or CI run:

```bash
npm run e2e:install
```

Run the suite:

```bash
npm run e2e
```

## Layout

- `smoke/` contains small UI smoke checks that prove the app can render and navigate.
- `specs/` contains durable requirement-backed scenarios mapped from OpenSpec capabilities.
- `support/` contains shared fixtures, routes, setup, and helpers.

For OpenSpec-backed tests, mirror each capability from `openspec/specs/<capability>/spec.md`
into `e2e/specs/<capability>/`.
