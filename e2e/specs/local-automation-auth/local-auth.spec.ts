import type { APIResponse } from "@playwright/test";

import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";

type LocalAutomationScenarioSuccess = {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    email: string;
    password: string;
    cleanupUrl: string;
  };
};

type LocalAutomationCleanupSuccess = {
  success: true;
  data: {
    deletedOrganizations: number;
  };
};

const LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS = 30_000;
const LOCAL_AUTOMATION_EMAIL_PATTERN = /^local-agent\+.+@local-agent\.test$/;
const LOCAL_AUTOMATION_USER_NAME = "OpenSpec Local Automation User";

const responseDebugMessage = (response: APIResponse, body: string) =>
  `Response ${response.status()} from ${response.url()}: ${body}`;

const parseResponseJson = <TResponse>(response: APIResponse, body: string): TResponse => {
  try {
    return JSON.parse(body) as TResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(
      `Expected JSON response from ${response.url()} with status ${response.status()}. ${message}. Body: ${body}`
    );
  }
};

test.describe("local automation auth", () => {
  test("shows local automation controls on the login page when enabled", async ({ page }) => {
    await page.goto(routes.home);

    await page
      .getByRole("link", { name: /Get Started|Начать/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/Welcome back|С возвращением/i)).toBeVisible();
    await expect(
      page.getByText("Create a local Better Auth user for browser testing.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Create local automation user" })).toBeVisible();
  });

  test("creates a browser session through the scenario route and cleans it up", async ({
    page,
  }) => {
    let cleanupRequired = false;
    let cleanupCompleted = false;

    try {
      const createResponse = await page.request.post(routes.localAutomationScenario, {
        data: {
          name: LOCAL_AUTOMATION_USER_NAME,
        },
        timeout: LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS,
      });
      const createResponseBody = await createResponse.text();

      expect(
        createResponse.status(),
        responseDebugMessage(createResponse, createResponseBody)
      ).toBe(201);
      cleanupRequired = true;

      const createBody = parseResponseJson<LocalAutomationScenarioSuccess>(
        createResponse,
        createResponseBody
      );
      expect(createBody.success).toBe(true);
      expect(createBody.data.email).toMatch(LOCAL_AUTOMATION_EMAIL_PATTERN);
      expect(createBody.data.password).toEqual(expect.any(String));
      expect(createBody.data.password.length).toBeGreaterThan(0);
      expect(createBody.data.user).toMatchObject({
        id: expect.any(String),
        email: createBody.data.email,
        name: LOCAL_AUTOMATION_USER_NAME,
      });
      expect(createBody.data.cleanupUrl).toBe(routes.localAutomationScenario);

      await page.goto(routes.welcome);

      await expect(page).toHaveURL(new RegExp(`${routes.welcome}$`));
      await expect(page.getByRole("heading", { name: /Welcome|Добро пожаловать/i })).toBeVisible();

      const cleanupResponse = await page.request.delete(routes.localAutomationScenario, {
        timeout: LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS,
      });
      const cleanupResponseBody = await cleanupResponse.text();

      expect(
        cleanupResponse.status(),
        responseDebugMessage(cleanupResponse, cleanupResponseBody)
      ).toBe(200);
      const cleanupBody = parseResponseJson<LocalAutomationCleanupSuccess>(
        cleanupResponse,
        cleanupResponseBody
      );
      expect(cleanupBody).toEqual({
        success: true,
        data: {
          deletedOrganizations: expect.any(Number),
        },
      });
      cleanupCompleted = true;

      await page.goto(routes.welcome);

      const redirectedUrl = new URL(page.url());
      expect(redirectedUrl.pathname).toBe(routes.login);
      expect(redirectedUrl.searchParams.get("redirect")).toBe(routes.welcome);
    } finally {
      if (cleanupRequired && !cleanupCompleted) {
        await page.request
          .delete(routes.localAutomationScenario, { timeout: LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS })
          .catch(() => undefined);
      }
    }
  });
});
