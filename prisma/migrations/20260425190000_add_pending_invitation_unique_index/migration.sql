-- Prevent concurrent duplicate pending invitations for the same organization and email.
-- Prisma schema cannot model partial expression indexes; keep this migration as raw SQL.
CREATE UNIQUE INDEX IF NOT EXISTS "invitations_pending_org_email_unique"
  ON "invitations" ("organizationId", lower("email"))
  WHERE "status" = 'pending';
