import type { BrowserContext, Page } from "@playwright/test";
import { createE2EBrowserContext } from "../../support/browser-context";
import { resolveE2EBaseURL } from "../../support/config";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";

test.use({ viewport: { width: 1440, height: 1100 } });

type LocalAutomationCredentials = {
  email: string;
  password: string;
};

const signInExistingAutomationUser = async (
  page: Page,
  credentials: LocalAutomationCredentials,
  baseURL: string | undefined
) => {
  const origin = resolveE2EBaseURL(baseURL);
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: {
      email: credentials.email,
      password: credentials.password,
      rememberMe: true,
    },
    headers: {
      origin,
      referer: new URL(routes.login, origin).toString(),
    },
  });

  expect(response.ok(), await response.text()).toBe(true);
};

const expectNoObviousBearerSecrets = async (page: Page, password: string) => {
  const visibleText = (await page.locator("body").innerText()).trim();
  const html = await page.content();

  expect(visibleText).not.toContain(password);
  expect(visibleText).not.toContain("Bearer ");
  expect(visibleText).not.toContain("acc.session=");
  expect(html).not.toContain(password);
  expect(html).not.toContain("Bearer ");
  expect(html).not.toContain("acc.session=");
};

test.describe("account-session-management: account security", () => {
  test("lists active sessions safely and revokes another session through the UI", async ({
    browser,
    page: ownerPage,
    baseURL,
  }) => {
    test.slow();

    const scenario = await signInLocalAutomationUser(ownerPage, {
      name: "E2E Account Session Owner",
    });
    const contextBaseURL = resolveE2EBaseURL(baseURL);
    let secondContext: BrowserContext | null = null;
    let secondPage: Page | null = null;

    try {
      secondContext = await createE2EBrowserContext(browser, contextBaseURL);
      secondPage = await secondContext.newPage();
      await signInExistingAutomationUser(secondPage, scenario, contextBaseURL);

      await secondPage.goto(routes.accountSecurity);
      await expect(
        secondPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();

      await ownerPage.goto(routes.accountSecurity);
      await expect(
        ownerPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();

      const sessionsRegion = ownerPage.getByRole("region", { name: "Active Sessions" });
      await expect(sessionsRegion).toBeVisible();
      await expect(sessionsRegion.getByText("Current session", { exact: true })).toBeVisible();
      await expect(sessionsRegion.getByRole("button", { name: "Revoke session" })).toBeVisible();
      await expectNoObviousBearerSecrets(ownerPage, scenario.password);

      await sessionsRegion.getByRole("button", { name: "Revoke session" }).click();
      await expect(ownerPage.getByText("Session revoked successfully")).toBeVisible();

      await secondPage.goto(routes.accountSecurity);
      await expect(secondPage).toHaveURL(/\/auth\/login/);
      await expect(
        secondPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toHaveCount(0);
    } finally {
      try {
        if (secondContext) {
          await secondContext.close();
        }
      } finally {
        await cleanupLocalAutomationUser(ownerPage);
      }
    }
  });

  test("revokes all other sessions while preserving the current session through the UI", async ({
    browser,
    page: ownerPage,
    baseURL,
  }) => {
    test.slow();

    const scenario = await signInLocalAutomationUser(ownerPage, {
      name: "E2E Account Session Bulk Owner",
    });
    const contextBaseURL = resolveE2EBaseURL(baseURL);
    let secondContext: BrowserContext | null = null;
    let secondPage: Page | null = null;
    let testError: unknown = null;
    let cleanupError: unknown = null;

    const cleanupScenario = async () => {
      try {
        await cleanupLocalAutomationUser(ownerPage);
      } catch {
        await signInExistingAutomationUser(ownerPage, scenario, contextBaseURL);
        await cleanupLocalAutomationUser(ownerPage);
      }
    };

    try {
      secondContext = await createE2EBrowserContext(browser, contextBaseURL);
      secondPage = await secondContext.newPage();
      await signInExistingAutomationUser(secondPage, scenario, contextBaseURL);

      await secondPage.goto(routes.accountSecurity);
      await expect(
        secondPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();

      await ownerPage.goto(routes.accountSecurity);
      await expect(
        ownerPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();

      const sessionsRegion = ownerPage.getByRole("region", { name: "Active Sessions" });
      await expect(sessionsRegion).toBeVisible();
      await expect(sessionsRegion.getByText("Current session", { exact: true })).toBeVisible();

      const revokeAllButton = sessionsRegion.getByRole("button", {
        name: "Revoke all other sessions",
      });
      await expect(revokeAllButton).toBeVisible();
      await revokeAllButton.click();
      await expect(ownerPage.getByText("Session revoked successfully")).toBeVisible();

      await expect(ownerPage).toHaveURL(new URL(routes.accountSecurity, contextBaseURL).toString());
      await expect(
        ownerPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toBeVisible();
      await expect(sessionsRegion).toBeVisible();
      await expect(sessionsRegion.getByText("Current session", { exact: true })).toBeVisible();
      await expect(revokeAllButton).toHaveCount(0);
      await expect(sessionsRegion.getByRole("button", { name: "Revoke session" })).toHaveCount(0);

      await secondPage.goto(routes.accountSecurity);
      await expect(secondPage).toHaveURL(/\/auth\/login/);
      await expect(
        secondPage.getByRole("heading", { level: 1, name: "Security & Sessions" })
      ).toHaveCount(0);
    } catch (error) {
      testError = error;
    } finally {
      if (secondContext) {
        try {
          await secondContext.close();
        } catch (error) {
          cleanupError ??= error;
        }
      }

      try {
        await cleanupScenario();
      } catch (error) {
        cleanupError ??= error;
      }
    }

    if (testError) {
      throw testError;
    }

    if (cleanupError) {
      throw cleanupError;
    }
  });
});
