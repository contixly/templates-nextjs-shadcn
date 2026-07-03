import type { Page } from "@playwright/test";
import { expect, test } from "../../support/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { routes } from "../../support/routes";

test.use({ viewport: { width: 1440, height: 1100 } });

const expectOnboardingGuardVisible = async (page: Page) => {
  await expect(page.getByText("Create your first workspace")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Workspace" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review Invitations" })).toBeVisible();
};

test.describe("workspace-onboarding-guard: zero-workspace access", () => {
  test("keeps global pages accessible and guards organization-scoped content", async ({ page }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Zero Workspace Guard",
    });

    try {
      await page.goto(routes.welcome);
      await expect(page).toHaveURL(routes.welcome);
      await expectOnboardingGuardVisible(page);

      await page.goto(routes.workspaces);
      await expect(page).toHaveURL(routes.workspaces);
      await expect(page.getByRole("heading", { level: 1, name: "Workspaces" })).toBeVisible();
      const createWorkspaceTrigger = page
        .getByRole("complementary")
        .getByRole("button", { name: "Create New Workspace" });

      await expect(createWorkspaceTrigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
      await createWorkspaceTrigger.click();
      await expect(page.getByRole("alertdialog", { name: "Create New Workspace" })).toBeVisible();

      await page.goto(routes.accountSecurity);
      await expect(page).toHaveURL(routes.accountSecurity);
      await expect(
        page.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();
      await expect(page.getByRole("region", { name: "Active Sessions" })).toBeVisible();

      await page.goto(routes.organizationDashboard("missing-e2e"));
      await expect(page).toHaveURL(routes.organizationDashboard("missing-e2e"));
      await expectOnboardingGuardVisible(page);
      await expect(page.getByText("Total Revenue")).toHaveCount(0);
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
