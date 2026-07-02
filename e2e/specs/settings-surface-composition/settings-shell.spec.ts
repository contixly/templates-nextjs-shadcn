import type { Page } from "@playwright/test";
import { expect, test } from "../../support/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { routes } from "../../support/routes";
import { createWorkspaceThroughUI } from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const getSettingsNavLink = (page: Page, name: string) =>
  page.locator("#main-content").getByRole("link", { name, exact: true });

test.describe("settings-surface-composition: shared settings shell", () => {
  test("renders account security inside the shared settings shell", async ({ page }) => {
    await signInLocalAutomationUser(page, {
      name: "E2E Settings Shell Account",
    });

    try {
      await page.goto(routes.accountSecurity);

      await expect(
        page.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();
      await expect(
        page.getByText(
          "Manage your active sessions, view login history, and control your account security settings."
        )
      ).toBeVisible();
      await expect(getSettingsNavLink(page, "Security & Sessions")).toHaveAttribute(
        "data-active",
        "true"
      );
      await expect(page.getByRole("region", { name: "Active Sessions" })).toBeVisible();
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("renders workspace settings and teams composition inside section islands", async ({
    page,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Settings Shell Workspace Owner",
    });

    try {
      const suffix = Date.now().toString(36);
      const firstOrganizationKey = await createWorkspaceThroughUI(
        page,
        `E2E Shell Primary ${suffix}`
      );
      await createWorkspaceThroughUI(page, `E2E Shell Secondary ${suffix}`);

      await page.goto(routes.workspaceSettingsWorkspace(firstOrganizationKey));

      await expect(
        page.getByRole("heading", { level: 1, name: "Workspace Settings" })
      ).toBeVisible();
      await expect(
        page
          .locator('[data-slot="settings-page-intro"]')
          .getByText("Update the workspace name and slug.")
      ).toBeVisible();
      await expect(page.getByRole("region", { name: "Workspace identity" })).toBeVisible();
      await expect(page.getByRole("region", { name: "Delete Workspace" })).toBeVisible();

      await page.goto(routes.workspaceSettingsTeams(firstOrganizationKey));

      await expect(page.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();
      const teamsRegion = page.getByRole("region", { name: "Workspace teams" });
      await expect(teamsRegion).toBeVisible();
      await expect(teamsRegion.getByText("No teams yet")).toBeVisible();
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
