import type { BrowserContext, Page } from "@playwright/test";
import { createE2EBrowserContext } from "../../support/browser-context";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  addExistingLocalAutomationUserWithDomainWarning,
  createWorkspaceThroughUI,
  updateWorkspaceSettingsThroughUI,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const getSettingsRail = (page: Page) => page.locator('[data-slot="settings-page-rail"]');

const getUserRow = (page: Page, email: string) =>
  page.getByRole("row").filter({ has: page.getByText(email, { exact: true }) });

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

test.describe("workspace-user-management: workspace users", () => {
  test("shows owner access, adds a member, updates their role, and keeps member access read-only", async ({
    baseURL,
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let memberContext: BrowserContext | null = null;
    let memberPage: Page | null = null;
    let memberSignedIn = false;

    try {
      const owner = await signInLocalAutomationUser(ownerPage, {
        name: "E2E Workspace Users Owner",
      });
      ownerSignedIn = true;
      const organizationKey = await createWorkspaceThroughUI(
        ownerPage,
        `E2E Users ${Date.now().toString(36)}`
      );

      await ownerPage.goto(routes.workspaceSettingsUsers(organizationKey));
      await expect(ownerPage.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();

      const currentUserRegion = ownerPage.getByRole("region", { name: "Your access" });
      await expect(currentUserRegion).toBeVisible();
      await expect(currentUserRegion.getByText(owner.user.name, { exact: true })).toBeVisible();
      await expect(currentUserRegion.getByText(owner.email, { exact: true })).toBeVisible();
      await expect(currentUserRegion.getByText("You", { exact: true })).toBeVisible();

      const otherUsersRegion = ownerPage.getByRole("region", { name: "Other workspace users" });
      await expect(otherUsersRegion).toBeVisible();
      await expect(otherUsersRegion.getByText("No other workspace users")).toBeVisible();

      memberContext = await createE2EBrowserContext(browser, baseURL);
      memberPage = await memberContext.newPage();
      const member = await signInLocalAutomationUser(memberPage, {
        name: "E2E Workspace Users Member",
      });
      memberSignedIn = true;

      await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
        organizationKey,
        userId: member.user.id,
        email: member.email,
      });

      const memberRow = getUserRow(ownerPage, member.email);
      await expect(memberRow).toBeVisible();
      await expect(memberRow.getByText(member.user.name, { exact: true })).toBeVisible();
      await expect(memberRow.getByText(member.email, { exact: true })).toBeVisible();
      await expect(
        memberRow.getByRole("combobox", { name: `Role for ${member.user.name}` })
      ).toContainText("Member");

      await memberPage.goto(routes.workspaceSettingsUsers(organizationKey));
      await expect(memberPage.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
      await expect(
        getSettingsRail(memberPage).getByText(
          "You can review workspace members here, but only admins and owners can add people or change roles in this release."
        )
      ).toBeVisible();
      await expect(
        getSettingsRail(memberPage).getByRole("button", { name: "Add Member" })
      ).toHaveCount(0);
      await expect(
        getSettingsRail(memberPage).getByRole("combobox", { name: /Role for/ })
      ).toHaveCount(0);
      await expect(
        getSettingsRail(memberPage).getByRole("button", { name: /remove|delete/i })
      ).toHaveCount(0);

      const memberRoleSelect = getUserRow(ownerPage, member.email).getByRole("combobox", {
        name: `Role for ${member.user.name}`,
      });
      await memberRoleSelect.click();
      await ownerPage.getByRole("option", { name: "Admin" }).click();
      await expect(ownerPage.getByText("Member role updated successfully")).toBeVisible();
      await expect(
        getUserRow(ownerPage, member.email).getByRole("combobox", {
          name: `Role for ${member.user.name}`,
        })
      ).toContainText("Admin");
    } finally {
      try {
        await cleanupSignedInContext(memberPage, memberContext, memberSignedIn);
      } finally {
        if (ownerSignedIn) {
          await cleanupLocalAutomationUser(ownerPage);
        }
      }
    }
  });

  test("shows domain restriction warning markers for outside-domain members", async ({
    baseURL,
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let outsideMemberContext: BrowserContext | null = null;
    let outsideMemberPage: Page | null = null;
    let outsideMemberSignedIn = false;

    try {
      await signInLocalAutomationUser(ownerPage, {
        name: "E2E Workspace Users Domain Owner",
      });
      ownerSignedIn = true;
      const organizationKey = await createWorkspaceThroughUI(
        ownerPage,
        `E2E Users Domain ${Date.now().toString(36)}`
      );

      await updateWorkspaceSettingsThroughUI(ownerPage, {
        organizationKey,
        allowedEmailDomains: "example.com",
      });

      outsideMemberContext = await createE2EBrowserContext(browser, baseURL);
      outsideMemberPage = await outsideMemberContext.newPage();
      const outsideMember = await signInLocalAutomationUser(outsideMemberPage, {
        name: "E2E Workspace Users Outside Domain",
      });
      outsideMemberSignedIn = true;

      await addExistingLocalAutomationUserWithDomainWarning(ownerPage, {
        organizationKey,
        userId: outsideMember.user.id,
        email: outsideMember.email,
      });

      await expect(ownerPage.getByText("Members outside allowed domains")).toBeVisible();
      const outsideMemberRow = getUserRow(ownerPage, outsideMember.email);
      await expect(outsideMemberRow).toBeVisible();
      await expect(outsideMemberRow.getByText("Outside domain policy")).toBeVisible();
    } finally {
      try {
        await cleanupSignedInContext(
          outsideMemberPage,
          outsideMemberContext,
          outsideMemberSignedIn
        );
      } finally {
        if (ownerSignedIn) {
          await cleanupLocalAutomationUser(ownerPage);
        }
      }
    }
  });
});
