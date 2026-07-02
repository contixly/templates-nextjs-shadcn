import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import {
  createWorkspaceThroughUI,
  expectNoDefaultWorkspaceUi,
  expectWorkspaceCardVisible,
  expectWorkspaceDeleteControlHidden,
  expectWorkspaceDeleteControlVisible,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

test.describe("workspace-organization-management: workspace lifecycle", () => {
  test("creates, lists, deduplicates slugs, and avoids default workspace UI", async ({ page }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Workspace Lifecycle Owner",
    });
    const suffix = Date.now().toString(36);
    const firstWorkspaceName = `E2E Slug ${suffix}`;
    const secondWorkspaceName = `E2E-Slug ${suffix}`;
    const firstWorkspaceSlug = `e2e-slug-${suffix}`;
    const secondWorkspaceSlug = `${firstWorkspaceSlug}-2`;

    try {
      const firstOrganizationKey = await createWorkspaceThroughUI(page, firstWorkspaceName);
      expect(firstOrganizationKey).toBe(firstWorkspaceSlug);

      await page.goto(routes.workspaces);
      await expect(page.getByRole("heading", { level: 1, name: "Workspaces" })).toBeVisible();
      await expectWorkspaceCardVisible(page, {
        name: firstWorkspaceName,
        slug: firstWorkspaceSlug,
      });
      await expectWorkspaceDeleteControlHidden(page, firstWorkspaceName);
      await expectNoDefaultWorkspaceUi(page);

      const secondOrganizationKey = await createWorkspaceThroughUI(page, secondWorkspaceName);
      expect(secondOrganizationKey).toBe(secondWorkspaceSlug);

      await page.goto(routes.workspaces);
      await expectWorkspaceCardVisible(page, {
        name: firstWorkspaceName,
        slug: firstWorkspaceSlug,
      });
      await expectWorkspaceCardVisible(page, {
        name: secondWorkspaceName,
        slug: secondWorkspaceSlug,
      });
      await expectWorkspaceDeleteControlVisible(page, firstWorkspaceName);
      await expectWorkspaceDeleteControlVisible(page, secondWorkspaceName);
      await expectNoDefaultWorkspaceUi(page);
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
