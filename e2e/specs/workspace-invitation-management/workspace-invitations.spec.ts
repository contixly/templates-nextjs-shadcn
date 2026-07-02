import type { BrowserContext, Page } from "@playwright/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import {
  createWorkspaceInvitationThroughUI,
  fillWorkspaceInvitationDialog,
  getWorkspaceInvitationRow,
  openCreateWorkspaceInvitationDialog,
} from "../../support/invitations";
import { routes } from "../../support/routes";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  createWorkspaceThroughUI,
  updateWorkspaceSettingsThroughUI,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

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

const addExistingLocalAutomationUserAsWorkspaceAdmin = async (
  page: Page,
  options: {
    organizationKey: string;
    userId: string;
    email: string;
  }
) => {
  await page.goto(routes.workspaceSettingsUsers(options.organizationKey));

  const trigger = page.getByRole("button", { name: "Add Member" }).first();
  await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
  await trigger.click();

  const dialog = page.getByRole("alertdialog").filter({ hasText: "Add Existing User" }).first();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("User ID").fill(options.userId);
  await dialog.getByLabel("Role").click();
  await page.getByRole("option", { name: "Admin" }).click();
  await dialog.getByRole("button", { name: "Add" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(options.email)).toBeVisible();
};

test.describe("workspace-invitation-management: invitations settings", () => {
  test("creates invitations, rejects duplicates and restricted domains, and denies regular members", async ({
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let memberContext: BrowserContext | null = null;
    let memberPage: Page | null = null;
    let memberSignedIn = false;
    let adminContext: BrowserContext | null = null;
    let adminPage: Page | null = null;
    let adminSignedIn = false;

    try {
      await signInLocalAutomationUser(ownerPage, {
        name: "E2E Workspace Invitations Owner",
      });
      ownerSignedIn = true;

      const suffix = Date.now().toString(36);
      const organizationKey = await createWorkspaceThroughUI(
        ownerPage,
        `E2E Invitations ${suffix}`
      );
      await expect(ownerPage.getByText("Total Revenue")).toBeVisible();
      const invitedEmail = `workspace-invite-${suffix}@example.test`;
      const restrictedEmail = `workspace-invite-restricted-${suffix}@outside.test`;

      adminContext = await browser.newContext();
      adminPage = await adminContext.newPage();
      const admin = await signInLocalAutomationUser(adminPage, {
        name: "E2E Workspace Invitations Admin",
      });
      adminSignedIn = true;

      memberContext = await browser.newContext();
      memberPage = await memberContext.newPage();
      const member = await signInLocalAutomationUser(memberPage, {
        name: "E2E Workspace Invitations Member",
      });
      memberSignedIn = true;

      await addExistingLocalAutomationUserAsWorkspaceAdmin(ownerPage, {
        organizationKey,
        userId: admin.user.id,
        email: admin.email,
      });
      await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
        organizationKey,
        userId: member.user.id,
        email: member.email,
      });

      await ownerPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      await expect(ownerPage.getByRole("heading", { level: 1, name: "Invitations" })).toBeVisible();

      const invitationActivity = ownerPage.getByRole("region", { name: "Invitation activity" });
      await expect(invitationActivity).toBeVisible();
      await expect(invitationActivity.getByText("No invitations yet")).toBeVisible();

      const createdInvitation = await createWorkspaceInvitationThroughUI(ownerPage, {
        organizationKey,
        email: invitedEmail,
        role: "Admin",
      });

      await expect(createdInvitation.dialog.getByRole("button", { name: "Copy" })).toBeVisible();
      expect(new URL(createdInvitation.invitationLink).pathname).toBe(
        routes.invitationDecision(createdInvitation.invitationId)
      );

      await ownerPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      await expect(ownerPage.getByRole("heading", { level: 1, name: "Invitations" })).toBeVisible();

      const invitationRow = getWorkspaceInvitationRow(ownerPage, invitedEmail);
      await expect(invitationRow).toBeVisible();
      await expect(invitationRow.getByText(invitedEmail, { exact: true })).toBeVisible();
      await expect(invitationRow.getByText("admin", { exact: true })).toBeVisible();
      await expect(invitationRow.getByText("Workspace only", { exact: true })).toBeVisible();
      await expect(invitationRow.getByText("Pending", { exact: true })).toBeVisible();

      await adminPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      await expect(adminPage.getByRole("heading", { level: 1, name: "Invitations" })).toBeVisible();
      await expect(adminPage.getByRole("button", { name: "Invite By Email" })).toBeVisible();
      const adminInvitationRow = getWorkspaceInvitationRow(adminPage, invitedEmail);
      await expect(adminInvitationRow).toBeVisible();
      await expect(adminInvitationRow.getByText("admin", { exact: true })).toBeVisible();
      await expect(adminInvitationRow.getByText("Pending", { exact: true })).toBeVisible();

      const duplicateDialog = await openCreateWorkspaceInvitationDialog(ownerPage);
      await fillWorkspaceInvitationDialog(ownerPage, duplicateDialog, {
        email: invitedEmail,
        role: "Admin",
      });
      await duplicateDialog.getByRole("button", { name: "Create" }).click();
      await expect(
        duplicateDialog.getByText(
          "Use a different email address; this one already has a pending invitation"
        )
      ).toBeVisible();
      await duplicateDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(duplicateDialog).toBeHidden();
      await ownerPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      await expect(getWorkspaceInvitationRow(ownerPage, invitedEmail)).toHaveCount(1);

      await updateWorkspaceSettingsThroughUI(ownerPage, {
        organizationKey,
        allowedEmailDomains: "example.com",
      });

      await ownerPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      const restrictedDialog = await openCreateWorkspaceInvitationDialog(ownerPage);
      await restrictedDialog.getByLabel("Email").fill(restrictedEmail);
      await expect(
        restrictedDialog.getByText("Use an email domain allowed by this workspace")
      ).toBeVisible();
      await expect(restrictedDialog.getByRole("button", { name: "Create" })).toBeDisabled();
      await expect(getWorkspaceInvitationRow(ownerPage, restrictedEmail)).toHaveCount(0);
      await restrictedDialog.getByRole("button", { name: "Cancel" }).click();
      await expect(restrictedDialog).toBeHidden();

      await memberPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      await expect(memberPage.getByText("403")).toBeVisible();
      await expect(memberPage.getByText("Oops! You are not authorized!")).toBeVisible();
      await expect(memberPage.getByRole("button", { name: "Invite By Email" })).toHaveCount(0);
      await expect(memberPage.getByRole("table")).toHaveCount(0);
      await expect(memberPage.getByText(invitedEmail, { exact: true })).toHaveCount(0);
    } finally {
      try {
        await cleanupSignedInContext(adminPage, adminContext, adminSignedIn);
      } finally {
        try {
          await cleanupSignedInContext(memberPage, memberContext, memberSignedIn);
        } finally {
          if (ownerSignedIn) {
            await cleanupLocalAutomationUser(ownerPage);
          }
        }
      }
    }
  });
});
