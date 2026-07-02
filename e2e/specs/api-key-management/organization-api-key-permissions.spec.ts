import type { BrowserContext, Page } from "@playwright/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  createWorkspaceThroughUI,
} from "../../support/workspaces";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";

test.use({ viewport: { width: 1440, height: 1100 } });

test.describe("api-key-management: organization API key permissions", () => {
  test("hides and denies organization API key settings for members without apiKey read", async ({
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    await signInLocalAutomationUser(ownerPage, {
      name: "E2E API Keys Permission Owner",
    });
    let memberContext: BrowserContext | null = null;
    let memberPage: Page | null = null;

    try {
      const organizationKey = await createWorkspaceThroughUI(
        ownerPage,
        `E2E API Key Permissions ${Date.now()}`
      );

      memberContext = await browser.newContext();
      memberPage = await memberContext.newPage();
      const memberScenario = await signInLocalAutomationUser(memberPage, {
        name: "E2E API Keys Permission Member",
      });

      await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
        organizationKey,
        userId: memberScenario.user.id,
        email: memberScenario.email,
      });

      await memberPage.goto(routes.workspaceSettingsUsers(organizationKey));

      await expect(memberPage.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
      await expect(memberPage.getByRole("link", { name: "API Keys", exact: true })).toHaveCount(0);

      await memberPage.goto(routes.workspaceSettingsApiKeys(organizationKey));

      await expect(memberPage.getByText("403")).toBeVisible();
      await expect(memberPage.getByText("Oops! You are not authorized!")).toBeVisible();

      await cleanupLocalAutomationUser(memberPage);
      await memberContext.close();
      memberContext = null;
      memberPage = null;
    } finally {
      if (memberPage) {
        await cleanupLocalAutomationUser(memberPage);
      }
      if (memberContext) {
        await memberContext.close();
      }
      await cleanupLocalAutomationUser(ownerPage);
    }
  });
});
