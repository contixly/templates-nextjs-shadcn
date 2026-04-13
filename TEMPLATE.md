# After you create a repository from this template

Use this checklist so your new project boots cleanly. Skip steps you do not need (for example, OAuth providers you will not enable).

## 1. Repository and metadata

- [ ] Replace the placeholder GitHub badge URL in `README.md` (search for `YOUR_GITHUB_OWNER` / `YOUR_REPO_NAME`) so the “Use this template” button points at your published template, or remove the badge if you do not need it.
- [ ] Set `package.json` `name` (and optionally `version`) to match your app.
- [ ] If you fork for your own product, update `LICENSE` copyright / year if needed.

## 2. Local environment

- [ ] Copy environment variables: create `.env.local` (and `.env` if you use scripts that load it) from the variables listed in `README.md` → **Environment variables**.
- [ ] Set `DATABASE_URL` for PostgreSQL (Prisma reads this variable).
- [ ] Set `BETTER_AUTH_SECRET` to a long random string.
- [ ] Set `BETTER_AUTH_URL` and `PUBLIC_BASE_URL` to your app origin (for local dev, e.g. `http://localhost:3000`). These must stay consistent with how you open the app in the browser.

## 3. Authentication (Better Auth)

- [ ] Configure only the OAuth providers you need in your provider dashboards. Redirect/callback URLs must match Better Auth (typically `{BETTER_AUTH_URL}/api/auth/callback/{provider}` — confirm in [Better Auth docs](https://www.better-auth.com)).
- [ ] Set the corresponding `*_CLIENT_ID` / `*_CLIENT_SECRET` (and Yandex/VK as applicable) in your env files.
- [ ] For production, review `src/lib/environment.ts`: replace `APP_BASE_DOMAIN` / production host logic with your real domain so cookies and URLs match your deployment.

## 4. Database

- [ ] Run `npx prisma migrate dev` after `DATABASE_URL` is set.
- [ ] Optionally open `npx prisma studio` to inspect data.

## 5. Optional services

- [ ] If you use AWS S3 or other integrations referenced in `AGENTS.md`, add their env vars and configure the relevant modules under `server/`.

## 6. Verify

- [ ] `npm install`
- [ ] `npm run dev`
- [ ] Sign-in flow works for at least one configured provider.

If something fails, compare your env names and URLs with `src/server/auth.ts` and `src/server/prisma.ts`.
