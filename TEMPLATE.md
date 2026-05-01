# After you create a repository from this template

Use this checklist so your new project boots cleanly. Skip steps you do not need (for example, OAuth providers you will
not enable).

## 1. Repository and metadata

- [ ] Replace the placeholder GitHub badge URL in `README.md` (search for `YOUR_GITHUB_OWNER` / `YOUR_REPO_NAME`) so the
  “Use this template” button points at your published template, or remove the badge if you do not need it.
- [ ] Set `package.json` `name` (and optionally `version`) to match your app.
- [ ] If you fork for your own product, update `LICENSE` copyright / year if needed.
- [ ] Use Node.js 22+ for local development and deployment. The distributed cache handler dependency requires it.

## 2. Local environment

- [ ] Copy environment variables: create `.env.local` (and `.env` if you use scripts that load it) from the variables
  listed in `README.md` → **Environment variables**.
- [ ] Set `DATABASE_URL` for PostgreSQL (Prisma reads this variable).
- [ ] Set `BETTER_AUTH_SECRET` to a long random string.
- [ ] Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_BASE_URL` to your app origin (for local dev, e.g.
  `http://localhost:3000`). These must stay consistent with how you open the app in the browser.
- [ ] Keep `LOCAL_AUTOMATION_AUTH_ENABLED=true` only in local development if you want Playwright, browser-use, or other
  automation agents to create temporary signed-in users. Disable or omit it outside local development.
- [ ] Leave `REMOTE_CACHING_ENABLED=false` for single-instance local development, or configure the cache variables in
  **Optional services** before enabling it.

## 3. Authentication (Better Auth)

- [ ] Configure only the OAuth providers you need in your provider dashboards. Redirect/callback URLs must match Better
  Auth (typically `{BETTER_AUTH_URL}/api/auth/callback/{provider}` — confirm
  in [Better Auth docs](https://www.better-auth.com)).
- [ ] Set the complete corresponding provider env set in your env files. Providers with missing required values are not
  registered with Better Auth and are hidden from login, navigation, and account connection UI.
- [ ] For production, review `src/lib/environment.ts`: replace `APP_BASE_DOMAIN` / production host logic with your real
  domain so cookies and URLs match your deployment.
- [ ] If you rely on local automation auth, use only the local automation flow and the
  `local-agent+...@local-agent.test` email namespace for generated or deterministic automation users.

## 4. Database

- [ ] Run `npx prisma migrate dev` after `DATABASE_URL` is set.
- [ ] Optionally open `npx prisma studio` to inspect data.

## 5. Optional services

- [ ] For distributed Cache Components / ISR caching, set `REMOTE_CACHING_ENABLED=true` and configure either `REDIS_URL`
  or `VALKEY_URL`.
- [ ] Set `REDIS_PASSWORD` only when the cache URL does not already include a password.
- [ ] Set a unique `REMOTE_CACHING_PREFIX` per deployed app/environment when sharing one Redis/Valkey instance.
- [ ] If you add AWS S3 or other integrations referenced in `AGENTS.md`, add their env vars and configure the relevant
  modules under `src/server/`.

## 6. Verify

- [ ] `npm install`
- [ ] `npm run e2e:install` once on machines that have not installed the Playwright Chromium browser yet.
- [ ] `npm run dev`
- [ ] Sign-in flow works for at least one configured OAuth provider, or the local automation login panel works when
  `LOCAL_AUTOMATION_AUTH_ENABLED=true`.
- [ ] `npm run e2e` passes. By default it starts the app on `http://127.0.0.1:3127`; override with
  `PLAYWRIGHT_BASE_URL` or set `PLAYWRIGHT_START_SERVER=false` when testing against an existing server.

If something fails, compare your env names and URLs with `src/server/auth.ts` and `src/server/prisma.ts`.
