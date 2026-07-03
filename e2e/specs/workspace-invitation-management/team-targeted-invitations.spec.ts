import type { BrowserContext, Page } from "@playwright/test";
import { createE2EBrowserContext } from "../../support/browser-context";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import {
  createWorkspaceInvitationThroughUI,
  verifyLocalAutomationInvitationRecipient,
} from "../../support/invitations";
import { routes } from "../../support/routes";
import { createWorkspaceThroughUI } from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const getWorkspaceTeamsRegion = (page: Page) =>
  page.getByRole("region", { name: "Workspace teams" });

const getTeamCard = (page: Page, teamName: string) =>
  getWorkspaceTeamsRegion(page)
    .locator('[data-slot="card"]')
    .filter({
      has: page.getByText(teamName, { exact: true }),
    });

const getTeamMemberRow = (page: Page, teamName: string, email: string) =>
  getTeamCard(page, teamName)
    .getByRole("row")
    .filter({ has: page.getByText(email, { exact: true }) });

const getPendingInvitationsCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({
    has: page.getByText("Pending Workspace Invitations", { exact: true }),
  });

const getInvitationDecisionCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({
    has: page.getByText("Workspace Invitation", { exact: true }),
  });

const createWorkspaceTeamThroughUI = async (
  page: Page,
  organizationKey: string,
  teamName: string
) => {
  await page.goto(routes.workspaceSettingsTeams(organizationKey));
  await expect(page.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();
  await page.getByLabel("Team name").first().fill(teamName);
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Team created successfully")).toBeVisible();
  await expect(getTeamCard(page, teamName)).toBeVisible();
};

const cleanupSignedInContext = async (
  page: Page | null,
  context: BrowserContext | null,
  signedIn: boolean
) => {
  try {
    if (signedIn && page) {
      await cleanupLocalAutomationUser(page);
    }
  } finally {
    if (context) {
      await context.close();
    }
  }
};

test.describe("workspace-invitation-management: team-targeted invitations", () => {
  test("adds an invitee to the selected team when they accept", async ({
    baseURL,
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let inviteeContext: BrowserContext | null = null;
    let inviteePage: Page | null = null;
    let inviteeSignedIn = false;

    try {
      await signInLocalAutomationUser(ownerPage, {
        name: "E2E Team Invitation Owner",
      });
      ownerSignedIn = true;

      const suffix = Date.now().toString(36);
      const workspaceName = `E2E Team Invitations ${suffix}`;
      const teamName = `E2E Invite Team ${suffix}`;
      const organizationKey = await createWorkspaceThroughUI(ownerPage, workspaceName);
      await expect(ownerPage.getByText("Total Revenue")).toBeVisible();

      await createWorkspaceTeamThroughUI(ownerPage, organizationKey, teamName);

      inviteeContext = await createE2EBrowserContext(browser, baseURL);
      inviteePage = await inviteeContext.newPage();
      const invitee = await signInLocalAutomationUser(inviteePage, {
        name: "E2E Team Invitation Invitee",
      });
      inviteeSignedIn = true;
      await verifyLocalAutomationInvitationRecipient(inviteePage, invitee);

      const invitation = await createWorkspaceInvitationThroughUI(ownerPage, {
        organizationKey,
        email: invitee.email,
        teamName,
      });
      await invitation.dialog.getByRole("button", { name: "Close" }).click();
      await expect(invitation.dialog).toBeHidden();

      await inviteePage.goto(routes.accountInvitations);
      const pendingInvitationsCard = getPendingInvitationsCard(inviteePage);
      await expect(pendingInvitationsCard).toBeVisible();
      await expect(
        pendingInvitationsCard.getByText(`Target team: ${teamName}`, { exact: true })
      ).toBeVisible();
      await pendingInvitationsCard.getByRole("link", { name: "Review Invitation" }).click();

      await expect(inviteePage).toHaveURL(routes.invitationDecision(invitation.invitationId));
      const decisionCard = getInvitationDecisionCard(inviteePage);
      await expect(decisionCard).toBeVisible();
      await expect(decisionCard.getByText(workspaceName, { exact: true })).toBeVisible();
      await expect(decisionCard.getByText(teamName, { exact: true })).toBeVisible();
      await expect(decisionCard.getByRole("button", { name: "Accept Invitation" })).toBeVisible();

      await decisionCard.getByRole("button", { name: "Accept Invitation" }).click();
      await expect(inviteePage.getByText("Invitation accepted successfully")).toBeVisible();
      await expect(inviteePage).toHaveURL(routes.organizationDashboard(organizationKey));

      await ownerPage.goto(routes.workspaceSettingsTeams(organizationKey));
      await expect(getTeamCard(ownerPage, teamName).getByText("1 member(s)")).toBeVisible();
      await expect(getTeamMemberRow(ownerPage, teamName, invitee.email)).toBeVisible();
      await expect(
        getTeamMemberRow(ownerPage, teamName, invitee.email).getByText("member", { exact: true })
      ).toBeVisible();
    } finally {
      try {
        await cleanupSignedInContext(inviteePage, inviteeContext, inviteeSignedIn);
      } finally {
        if (ownerSignedIn) {
          await cleanupLocalAutomationUser(ownerPage);
        }
      }
    }
  });
});
