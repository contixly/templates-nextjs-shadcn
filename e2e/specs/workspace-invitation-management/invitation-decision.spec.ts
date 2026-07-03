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

const getPendingInvitationsCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({
    has: page.getByText("Pending Workspace Invitations", { exact: true }),
  });

const getInvitationDecisionCard = (page: Page) =>
  page.locator('[data-slot="card"]').filter({
    has: page.getByText("Workspace Invitation", { exact: true }),
  });

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

test.describe("workspace-invitation-management: invitation decisions", () => {
  test("lets invitees review, accept, and reject workspace invitations", async ({
    baseURL,
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let acceptContext: BrowserContext | null = null;
    let acceptPage: Page | null = null;
    let acceptSignedIn = false;
    let rejectContext: BrowserContext | null = null;
    let rejectPage: Page | null = null;
    let rejectSignedIn = false;

    try {
      await signInLocalAutomationUser(ownerPage, {
        name: "E2E Invitation Decision Owner",
      });
      ownerSignedIn = true;

      const suffix = Date.now().toString(36);
      const workspaceName = `E2E Invitation Decisions ${suffix}`;
      const organizationKey = await createWorkspaceThroughUI(ownerPage, workspaceName);
      await expect(ownerPage.getByText("Total Revenue")).toBeVisible();

      acceptContext = await createE2EBrowserContext(browser, baseURL);
      acceptPage = await acceptContext.newPage();
      const acceptInvitee = await signInLocalAutomationUser(acceptPage, {
        name: "E2E Invitation Accept Invitee",
      });
      acceptSignedIn = true;
      await verifyLocalAutomationInvitationRecipient(acceptPage, acceptInvitee);

      rejectContext = await createE2EBrowserContext(browser, baseURL);
      rejectPage = await rejectContext.newPage();
      const rejectInvitee = await signInLocalAutomationUser(rejectPage, {
        name: "E2E Invitation Reject Invitee",
      });
      rejectSignedIn = true;
      await verifyLocalAutomationInvitationRecipient(rejectPage, rejectInvitee);

      const acceptInvitation = await createWorkspaceInvitationThroughUI(ownerPage, {
        organizationKey,
        email: acceptInvitee.email,
      });
      await acceptInvitation.dialog.getByRole("button", { name: "Close" }).click();
      await expect(acceptInvitation.dialog).toBeHidden();

      const rejectInvitation = await createWorkspaceInvitationThroughUI(ownerPage, {
        organizationKey,
        email: rejectInvitee.email,
      });
      await rejectInvitation.dialog.getByRole("button", { name: "Close" }).click();
      await expect(rejectInvitation.dialog).toBeHidden();

      await acceptPage.goto(routes.accountInvitations);
      const acceptPendingCard = getPendingInvitationsCard(acceptPage);
      await expect(acceptPendingCard).toBeVisible();
      await expect(
        acceptPendingCard.getByText(`Invited email: ${acceptInvitee.email}`, { exact: true })
      ).toBeVisible();

      const acceptReviewLink = acceptPendingCard.getByRole("link", { name: "Review Invitation" });
      await expect(acceptReviewLink).toHaveAttribute(
        "href",
        routes.invitationDecision(acceptInvitation.invitationId)
      );
      await acceptReviewLink.click();
      await expect(acceptPage).toHaveURL(routes.invitationDecision(acceptInvitation.invitationId));

      const acceptDecisionCard = getInvitationDecisionCard(acceptPage);
      await expect(acceptDecisionCard).toBeVisible();
      await expect(acceptDecisionCard.getByText(workspaceName, { exact: true })).toBeVisible();
      await expect(
        acceptDecisionCard.getByText(acceptInvitee.email, { exact: true })
      ).toBeVisible();
      await expect(acceptDecisionCard.getByText("member", { exact: true })).toBeVisible();
      await expect(acceptDecisionCard.getByText("Workspace only", { exact: true })).toBeVisible();
      await expect(
        acceptDecisionCard.getByRole("button", { name: "Accept Invitation" })
      ).toBeVisible();
      await expect(
        acceptDecisionCard.getByRole("button", { name: "Reject Invitation" })
      ).toBeVisible();

      await acceptDecisionCard.getByRole("button", { name: "Accept Invitation" }).click();
      await expect(acceptPage.getByText("Invitation accepted successfully")).toBeVisible();
      await expect(acceptPage).toHaveURL(routes.organizationDashboard(organizationKey));

      await acceptPage.goto(routes.workspaceSettingsUsers(organizationKey));
      await expect(acceptPage.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
      const acceptedUserAccessRegion = acceptPage.getByRole("region", { name: "Your access" });
      await expect(acceptedUserAccessRegion).toBeVisible();
      await expect(
        acceptedUserAccessRegion.getByText(acceptInvitee.email, { exact: true })
      ).toBeVisible();

      await rejectPage.goto(routes.accountInvitations);
      const rejectPendingCard = getPendingInvitationsCard(rejectPage);
      await expect(rejectPendingCard).toBeVisible();
      await expect(
        rejectPendingCard.getByText(`Invited email: ${rejectInvitee.email}`, { exact: true })
      ).toBeVisible();

      const rejectReviewLink = rejectPendingCard.getByRole("link", { name: "Review Invitation" });
      await expect(rejectReviewLink).toHaveAttribute(
        "href",
        routes.invitationDecision(rejectInvitation.invitationId)
      );
      await rejectReviewLink.click();
      await expect(rejectPage).toHaveURL(routes.invitationDecision(rejectInvitation.invitationId));

      const rejectDecisionCard = getInvitationDecisionCard(rejectPage);
      await expect(rejectDecisionCard).toBeVisible();
      await expect(rejectDecisionCard.getByText(workspaceName, { exact: true })).toBeVisible();
      await expect(
        rejectDecisionCard.getByText(rejectInvitee.email, { exact: true })
      ).toBeVisible();
      await expect(rejectDecisionCard.getByText("member", { exact: true })).toBeVisible();
      await expect(
        rejectDecisionCard.getByRole("button", { name: "Accept Invitation" })
      ).toBeVisible();
      await expect(
        rejectDecisionCard.getByRole("button", { name: "Reject Invitation" })
      ).toBeVisible();

      await rejectDecisionCard.getByRole("button", { name: "Reject Invitation" }).click();
      await expect(rejectPage.getByText("Invitation rejected successfully")).toBeVisible();
      await expect(rejectDecisionCard.getByText("Rejected", { exact: true })).toBeVisible();
      await expect(
        rejectDecisionCard.getByRole("button", { name: "Accept Invitation" })
      ).toHaveCount(0);
      await expect(
        rejectDecisionCard.getByRole("button", { name: "Reject Invitation" })
      ).toHaveCount(0);

      await rejectPage.goto(routes.accountInvitations);
      await expect(rejectPage.getByText("No pending invitations")).toBeVisible();
      await expect(rejectPage.getByRole("link", { name: "Review Invitation" })).toHaveCount(0);
    } finally {
      try {
        await cleanupSignedInContext(rejectPage, rejectContext, rejectSignedIn);
      } finally {
        try {
          await cleanupSignedInContext(acceptPage, acceptContext, acceptSignedIn);
        } finally {
          if (ownerSignedIn) {
            await cleanupLocalAutomationUser(ownerPage);
          }
        }
      }
    }
  });
});
