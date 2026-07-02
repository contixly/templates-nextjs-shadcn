import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "../../support/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { routes } from "../../support/routes";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  createWorkspaceThroughUI,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const getWorkspaceSettingsNavLink = (page: Page, name: string) =>
  page.locator("#main-content").getByRole("link", { name, exact: true });

const expectBaseWorkspaceSettingsLinksVisible = async (page: Page) => {
  await expect(getWorkspaceSettingsNavLink(page, "Workspace Settings")).toBeVisible();
  await expect(getWorkspaceSettingsNavLink(page, "Users")).toBeVisible();
  await expect(getWorkspaceSettingsNavLink(page, "Teams")).toBeVisible();
  await expect(getWorkspaceSettingsNavLink(page, "Roles")).toBeVisible();
};

test.describe("workspace-settings-navigation: settings routes", () => {
  test("redirects root settings to workspace settings and marks the selected nav section", async ({
    page,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Settings Navigation Owner",
    });

    try {
      const organizationKey = await createWorkspaceThroughUI(
        page,
        `E2E Settings Navigation ${Date.now().toString(36)}`
      );

      await page.goto(routes.workspaceSettings(organizationKey));
      await expect(page).toHaveURL(routes.workspaceSettingsWorkspace(organizationKey));

      await page.goto(routes.workspaceSettingsUsers(organizationKey));
      await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
      await expect(
        page.getByText("Review workspace members, their roles, and add existing users by ID.")
      ).toBeVisible();
      await expectBaseWorkspaceSettingsLinksVisible(page);
      await expect(getWorkspaceSettingsNavLink(page, "Users")).toHaveAttribute(
        "data-active",
        "true"
      );
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("shows invitations to owners and hides or denies them for regular members", async ({
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    await signInLocalAutomationUser(ownerPage, {
      name: "E2E Settings Navigation Invitation Owner",
    });
    try {
      const organizationKey = await createWorkspaceThroughUI(
        ownerPage,
        `E2E Settings Invitation ${Date.now().toString(36)}`
      );

      await ownerPage.goto(routes.workspaceSettingsWorkspace(organizationKey));
      await expectBaseWorkspaceSettingsLinksVisible(ownerPage);
      await expect(getWorkspaceSettingsNavLink(ownerPage, "Invitations")).toBeVisible();

      await ownerPage.goto(routes.workspaceSettingsInvitations(organizationKey));
      await expect(ownerPage.getByRole("heading", { level: 1, name: "Invitations" })).toBeVisible();
      await expect(ownerPage.getByText("Invitation activity")).toBeVisible();

      const memberContext: BrowserContext = await browser.newContext();
      let memberPage: Page | null = null;

      try {
        memberPage = await memberContext.newPage();
        const memberScenario = await signInLocalAutomationUser(memberPage, {
          name: "E2E Settings Navigation Regular Member",
        });

        await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
          organizationKey,
          userId: memberScenario.user.id,
          email: memberScenario.email,
        });

        await memberPage.goto(routes.workspaceSettingsUsers(organizationKey));
        await expect(memberPage.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
        await expectBaseWorkspaceSettingsLinksVisible(memberPage);
        await expect(getWorkspaceSettingsNavLink(memberPage, "Invitations")).toHaveCount(0);

        await memberPage.goto(routes.workspaceSettingsInvitations(organizationKey));
        await expect(memberPage.getByText("403")).toBeVisible();
        await expect(memberPage.getByText("Oops! You are not authorized!")).toBeVisible();
      } finally {
        try {
          if (memberPage) {
            await cleanupLocalAutomationUser(memberPage);
          }
        } finally {
          await memberContext.close();
        }
      }
    } finally {
      await cleanupLocalAutomationUser(ownerPage);
    }
  });

  test("renders roles as a placeholder without management controls", async ({ page }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Settings Navigation Roles Owner",
    });

    try {
      const organizationKey = await createWorkspaceThroughUI(
        page,
        `E2E Settings Roles ${Date.now().toString(36)}`
      );

      await page.goto(routes.workspaceSettingsRoles(organizationKey));

      await expect(page.getByRole("heading", { level: 1, name: "Roles" })).toBeVisible();
      const rolesRegion = page.getByRole("region", { name: "Role management" });
      await expect(rolesRegion).toBeVisible();
      await expect(rolesRegion.getByText("Coming soon")).toBeVisible();
      await expect(
        rolesRegion.getByText(
          "This section is visible now so workspace administration has a stable home, but management tools for it are not part of this change yet."
        )
      ).toBeVisible();
      await expect(rolesRegion.getByRole("button")).toHaveCount(0);
      await expect(rolesRegion.locator("form")).toHaveCount(0);
      await expect(rolesRegion.getByRole("textbox")).toHaveCount(0);
      await expect(rolesRegion.getByRole("combobox")).toHaveCount(0);
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
