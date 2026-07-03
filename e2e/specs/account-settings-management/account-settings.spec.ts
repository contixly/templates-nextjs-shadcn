import type { Locator, Page } from "@playwright/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";

test.use({ viewport: { width: 1440, height: 1100 } });

const getSettingsNavLink = (page: Page, name: string) =>
  page.locator("#main-content").getByRole("link", { name, exact: true });

const expectSettingsHeading = async (page: Page, name: string) => {
  const heading = page.getByRole("heading", { level: 1, name });
  const isColdNotFound = await page
    .getByRole("heading", { level: 1, name: "404" })
    .isVisible({ timeout: 500 })
    .catch(() => false);

  if (isColdNotFound) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }

  await expect(heading).toBeVisible();
};

const expectAccountSettingsNavigation = async (page: Page) => {
  const expectedLinks = [
    ["Profile Settings", routes.accountProfile],
    ["My Invitations", routes.accountInvitations],
    ["Connected Accounts", routes.accountConnections],
    ["Security & Sessions", routes.accountSecurity],
    ["API Keys", routes.personalApiKeys],
    ["Danger Zone", routes.accountDanger],
  ] as const;

  for (const [name, href] of expectedLinks) {
    await expect(getSettingsNavLink(page, name)).toHaveAttribute("href", href);
  }

  await expect(getSettingsNavLink(page, "Danger Zone")).toHaveClass(/text-destructive/);
};

const expectProviderItemState = async (providerItem: Locator) => {
  await expect(providerItem.getByText(/Not connected|Connected on|Last used/)).toBeVisible();
  await expect(providerItem.getByRole("button", { name: /^(Connect|Disconnect)$/ })).toBeVisible();
};

test.describe("account-settings-management: account settings", () => {
  test("redirects root, renders profile account data, and updates display name", async ({
    page,
  }) => {
    const scenario = await signInLocalAutomationUser(page, {
      name: "E2E Account Settings Original",
    });
    const newDisplayName = `E2E Account Settings ${Date.now().toString(36)}`;

    try {
      await page.goto(routes.userSettingsRoot);

      await expect(page).toHaveURL(new RegExp(`${routes.accountProfile}$`));
      await expectSettingsHeading(page, "Profile Settings");
      await expectAccountSettingsNavigation(page);

      await expect(
        page
          .locator('#main-content [data-slot="settings-page-intro"]')
          .getByText("Manage your profile settings", { exact: false })
      ).toBeVisible();
      await expect(page.getByRole("region", { name: "Avatar" })).toBeVisible();

      const displayNameRegion = page.getByRole("region", { name: "Display Name" });
      await expect(displayNameRegion).toBeVisible();

      const emailRegion = page.getByRole("region", { name: "Email Address" });
      const emailInput = emailRegion.locator("input").first();
      await expect(emailRegion).toBeVisible();
      await expect(emailInput).toHaveValue(scenario.user.email);
      await expect(emailInput).toBeDisabled();

      const userIdRegion = page.getByRole("region", { name: "User ID" });
      const userIdInput = userIdRegion.locator("input").first();
      await expect(userIdRegion).toBeVisible();
      await expect(userIdInput).toHaveValue(scenario.user.id);
      await expect(userIdInput).toBeDisabled();

      await expect(page.getByRole("region", { name: "Member Since" })).toBeVisible();

      const nameInput = displayNameRegion.getByPlaceholder("Enter your display name");
      await expect(nameInput).toHaveValue(scenario.user.name);
      await nameInput.fill(`  ${newDisplayName}  `);
      await displayNameRegion.getByRole("button", { name: "Save" }).click();

      await expect(page.getByText("Profile updated successfully")).toBeVisible();
      await expect(nameInput).toHaveValue(newDisplayName);
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("shows rendered provider state without invoking OAuth link flows", async ({ page }) => {
    await signInLocalAutomationUser(page, {
      name: "E2E Account Settings Connections",
    });

    try {
      await page.goto(routes.accountConnections);

      await expectSettingsHeading(page, "Connected Accounts");
      await expectAccountSettingsNavigation(page);

      const connectionsRegion = page.getByRole("region", { name: "Login providers" });
      await expect(connectionsRegion).toBeVisible();

      const providerItems = connectionsRegion.locator('[data-slot="item"]');
      await expect(providerItems.first()).toBeVisible();

      for (let index = 0; index < (await providerItems.count()); index += 1) {
        await expectProviderItemState(providerItems.nth(index));
      }
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("rejects mismatched delete confirmation without deleting the account", async ({ page }) => {
    const scenario = await signInLocalAutomationUser(page, {
      name: "E2E Account Settings Danger",
    });

    try {
      await page.goto(routes.accountDanger);

      await expectSettingsHeading(page, "Danger Zone");

      const dangerRegion = page.getByRole("region", { name: "Delete account" });
      await expect(dangerRegion).toBeVisible();
      await expect(dangerRegion.getByText("Delete Account?")).toBeVisible();
      const deleteAccountTrigger = dangerRegion.locator('[data-slot="alert-dialog-trigger"]');
      await expect(deleteAccountTrigger).toBeVisible();
      await deleteAccountTrigger.click();

      const deleteDialog = page.getByRole("alertdialog", { name: "Delete Account?" });
      await expect(deleteDialog).toBeVisible();
      await expect(
        deleteDialog.getByText(`please type “${scenario.user.email}”`, { exact: false })
      ).toBeVisible();

      await deleteDialog
        .getByPlaceholder("Type email to confirm deletion")
        .fill(`not-${Date.now().toString(36)}@local-agent.test`);

      await expect(
        deleteDialog.getByText("Enter your account email address exactly")
      ).toBeVisible();
      await expect(deleteDialog.getByRole("button", { name: "Delete" })).toBeDisabled();
      await expect(page).toHaveURL(new RegExp(`${routes.accountDanger}$`));
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
