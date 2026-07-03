import { expect, test } from "../../support/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { routes } from "../../support/routes";
import { createWorkspaceThroughUI } from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

test.describe("workspace-page-fallback: workspace root", () => {
  test("validates accessible workspace root access before redirecting to dashboard", async ({
    page,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Workspace Root Owner",
    });

    try {
      const organizationKey = await createWorkspaceThroughUI(
        page,
        `E2E Workspace Root ${Date.now().toString(36)}`
      );

      await page.goto(routes.workspace(organizationKey));

      await expect(page).toHaveURL(routes.organizationDashboard(organizationKey));
      await expect(page.getByText("Total Revenue")).toBeVisible();
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("renders forbidden instead of a blank page for inaccessible workspace roots", async ({
    page,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Workspace Root Forbidden Owner",
    });

    try {
      await createWorkspaceThroughUI(
        page,
        `E2E Workspace Root Forbidden ${Date.now().toString(36)}`
      );

      await page.goto(routes.workspace("missing-e2e-workspace"));

      await expect(page.getByText("403")).toBeVisible();
      await expect(page.getByText("Oops! You are not authorized!")).toBeVisible();
      await expect(page.getByText("Total Revenue")).toHaveCount(0);
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
