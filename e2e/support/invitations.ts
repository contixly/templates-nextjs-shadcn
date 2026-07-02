import "dotenv/config";
import { expect, type Locator, type Page } from "@playwright/test";
import { Pool } from "pg";
import type { LocalAutomationScenario } from "./local-auth";
import { resolveE2EBaseURL } from "./config";
import { routes } from "./routes";

export type WorkspaceInvitationRoleLabel = "Member" | "Admin" | "Owner";

export type CreateWorkspaceInvitationOptions = {
  organizationKey: string;
  email: string;
  role?: WorkspaceInvitationRoleLabel;
  teamName?: string;
};

const createE2EDatabasePool = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for invitation E2E setup");
  }

  return new Pool({
    connectionString,
    max: 1,
  });
};

const runE2EDatabaseQuery = async (queryText: string, values: readonly unknown[]) => {
  const pool = createE2EDatabasePool();

  try {
    // @ts-expect-error unknown values type
    return await pool.query(queryText, values);
  } finally {
    await pool.end();
  }
};

const clickHydratedModalTrigger = async (page: Page, name: string | RegExp) => {
  const trigger = page.getByRole("button", { name }).first();

  await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
  await trigger.click();
};

const getCreateInvitationDialog = (page: Page) =>
  page.getByRole("alertdialog").filter({ hasText: "Invite By Email" }).first();

export const getWorkspaceInvitationRow = (page: Page, email: string) =>
  page.getByRole("row").filter({
    has: page.getByText(email, { exact: true }),
  });

export const openCreateWorkspaceInvitationDialog = async (page: Page) => {
  await clickHydratedModalTrigger(page, "Invite By Email");

  const dialog = getCreateInvitationDialog(page);
  await expect(dialog).toBeVisible();

  return dialog;
};

export const fillWorkspaceInvitationDialog = async (
  page: Page,
  dialog: Locator,
  options: Pick<CreateWorkspaceInvitationOptions, "email" | "role" | "teamName">
) => {
  await dialog.getByLabel("Email").fill(options.email);

  if (options.role) {
    await dialog.getByLabel("Role").click();
    await page.getByRole("option", { name: options.role }).click();
  }

  if (options.teamName) {
    await dialog.getByLabel("Team").click();
    await page.getByRole("option", { name: options.teamName }).click();
  }
};

export const extractInvitationIdFromLink = (invitationLink: string) => {
  const { pathname } = new URL(invitationLink, "http://localhost");
  const invitationId = pathname.match(/^\/invite\/([^/]+)$/)?.[1];

  expect(invitationId, `Could not extract invitation id from ${invitationLink}`).toBeTruthy();

  return decodeURIComponent(invitationId as string);
};

export const readCreatedWorkspaceInvitation = async (dialog: Locator) => {
  const linkField = dialog.getByLabel("Invitation link");

  await expect(linkField).toBeVisible();
  await expect(linkField).toHaveAttribute("readonly", "");

  const invitationLink = await linkField.inputValue();

  expect(invitationLink).toContain("/invite/");

  return {
    invitationLink,
    invitationId: extractInvitationIdFromLink(invitationLink),
  };
};

export const createWorkspaceInvitationThroughUI = async (
  page: Page,
  options: CreateWorkspaceInvitationOptions
) => {
  await page.goto(routes.workspaceSettingsInvitations(options.organizationKey));

  const dialog = await openCreateWorkspaceInvitationDialog(page);
  await fillWorkspaceInvitationDialog(page, dialog, options);
  await dialog.getByRole("button", { name: "Create" }).click();
  await expect(dialog.getByText("Invitation created")).toBeVisible();

  return {
    dialog,
    ...(await readCreatedWorkspaceInvitation(dialog)),
  };
};

export const verifyLocalAutomationInvitationRecipient = async (
  page: Page,
  scenario: LocalAutomationScenario
) => {
  const result = await runE2EDatabaseQuery(
    'UPDATE "users" SET "emailVerified" = TRUE WHERE "id" = $1',
    [scenario.user.id]
  );

  expect(result.rowCount, `Expected to verify ${scenario.email}`).toBe(1);

  const authOrigin = resolveE2EBaseURL();

  const response = await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: scenario.email,
      password: scenario.password,
      rememberMe: true,
    },
    headers: {
      origin: authOrigin,
      referer: `${authOrigin}/`,
    },
    timeout: 30_000,
  });
  const body = await response.text();

  expect(response.ok(), body).toBe(true);
};
