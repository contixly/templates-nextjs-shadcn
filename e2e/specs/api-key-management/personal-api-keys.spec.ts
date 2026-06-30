import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import {
  callApiV1WithKey,
  createApiKeyThroughUI,
  deleteApiKeyThroughUI,
  editApiKeyNameThroughUI,
} from "../../support/api-keys";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";

test.use({ viewport: { width: 1440, height: 1100 } });

type MeApiResponse = {
  data: {
    principal: {
      type: "user" | "organization";
      userId: string | null;
      organizationId: string | null;
    };
    key: {
      configId: string;
    };
  };
};

test.describe("api-key-management: personal API keys", () => {
  test("requires authentication before personal API key data is returned", async ({ page }) => {
    await page.goto(routes.personalApiKeys);

    await expect(page).toHaveURL(/\/auth\/login\?redirect=\/user\/api-keys$/);

    const redirectedUrl = new URL(page.url());
    expect(redirectedUrl.pathname).toBe(routes.login);
    expect(redirectedUrl.searchParams.get("redirect")).toBe(routes.personalApiKeys);
  });

  test("creates, uses, updates, and deletes a personal key", async ({ page }) => {
    const scenario = await signInLocalAutomationUser(page, {
      name: "E2E API Keys Personal User",
    });
    const suffix = Date.now().toString(36);
    const keyName = `p-e2e-${suffix}`;
    const renamedKeyName = `p-e2e-${suffix}-renamed`;

    try {
      await page.goto(routes.personalApiKeys);

      await expect(page.getByRole("heading", { level: 1, name: "API keys" })).toBeVisible();
      await expect(page.getByText("Personal keys act as your user account.")).toBeVisible();
      await expect(
        page.getByText(
          "Organization API routes only return data that your current organization membership allows."
        )
      ).toBeVisible();
      await expect(
        page.getByText("Organization keys act as a service principal for one organization.")
      ).toBeVisible();
      await expect(page.getByText("No API keys")).toBeVisible();

      const secret = await createApiKeyThroughUI(page, {
        name: keyName,
      });

      expect(secret).toMatch(/^user_/);

      const meResponse = await callApiV1WithKey<MeApiResponse>(page, routes.apiV1Me, secret);
      expect(meResponse.status).toBe(200);
      expect(meResponse.body).toMatchObject({
        data: {
          principal: {
            type: "user",
            userId: scenario.user.id,
            organizationId: null,
          },
          key: {
            configId: "user-keys",
          },
        },
      });

      await editApiKeyNameThroughUI(page, keyName, renamedKeyName);
      await expect(page.getByText(renamedKeyName, { exact: true })).toBeVisible();

      await deleteApiKeyThroughUI(page, renamedKeyName);
      await expect(page.getByText(renamedKeyName, { exact: true })).toHaveCount(0);

      const deletedResponse = await callApiV1WithKey(page, routes.apiV1Me, secret);
      expect(deletedResponse.status).toBe(401);
      expect(deletedResponse.body).toMatchObject({
        error: {
          code: "api_key_invalid",
        },
      });
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
