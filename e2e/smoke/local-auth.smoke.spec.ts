import { expect, test } from "../support/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../support/local-auth";
import { routes } from "../support/routes";

test.describe("local automation auth smoke", () => {
  test("signs in with local automation auth, opens a protected page, and cleans up", async ({
    page,
  }) => {
    const scenario = await signInLocalAutomationUser(page, {
      name: "E2E Local Automation User",
    });

    expect(scenario.email).toMatch(/^local-agent\+.+@local-agent\.test$/);
    expect(scenario.cleanupUrl).toBe(routes.localAutomationScenario);

    try {
      await page.goto(routes.welcome);

      await expect(page).toHaveURL(new RegExp(`${routes.welcome}$`));
      await expect(page.getByRole("heading", { name: /Welcome|Добро пожаловать/i })).toBeVisible();
      await expect(
        page.getByText(/Create your first workspace|Создайте первое рабочее пространство/i)
      ).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: /Create Workspace|Создать рабочее пространство/i,
        })
      ).toBeVisible();
    } finally {
      await cleanupLocalAutomationUser(page);
    }

    await page.goto(routes.welcome);

    await expect(page).toHaveURL(/\/auth\/login\?redirect=\/welcome$/);

    const redirectedUrl = new URL(page.url());
    expect(redirectedUrl.pathname).toBe(routes.login);
    expect(redirectedUrl.searchParams.get("redirect")).toBe(routes.welcome);
  });
});
