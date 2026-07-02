import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import {
  createWorkspaceThroughUI,
  switchWorkspaceFromBreadcrumb,
  switchWorkspaceFromSidebar,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

test.describe("workspace-organization-management: workspace switching", () => {
  test("sidebar and breadcrumb switchers preserve base workspace routes", async ({ page }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Workspace Switching Owner",
    });
    const suffix = Date.now().toString(36);
    const firstWorkspaceName = `E2E Switch Primary ${suffix}`;
    const secondWorkspaceName = `E2E Switch Secondary ${suffix}`;

    try {
      const firstOrganizationKey = await createWorkspaceThroughUI(page, firstWorkspaceName);
      const secondOrganizationKey = await createWorkspaceThroughUI(page, secondWorkspaceName);

      await page.goto(routes.workspaceSettingsUsers(firstOrganizationKey));
      await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();

      await switchWorkspaceFromSidebar(
        page,
        firstWorkspaceName,
        secondWorkspaceName,
        routes.workspaceSettingsUsers(secondOrganizationKey)
      );
      await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();

      await switchWorkspaceFromBreadcrumb(
        page,
        secondWorkspaceName,
        firstWorkspaceName,
        routes.workspaceSettingsUsers(firstOrganizationKey)
      );
      await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
