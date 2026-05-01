import { expect, test } from "../support/test";
import { routes } from "../support/routes";

test.describe("public UI smoke", () => {
  test("renders the public home page and login page", async ({ page }) => {
    await page.goto(routes.home);

    await expect(
      page.getByRole("heading", {
        name: /Workspace collaboration for|Совместная работа в workspace для/i,
      })
    ).toBeVisible();
    await expect(page.getByText("Next.js 16")).toBeVisible();

    const getStartedLink = page.getByRole("link", { name: /Get Started|Начать/i }).first();

    await expect(getStartedLink).toBeVisible();
    await expect(getStartedLink).toHaveAttribute("href", /\/auth\/login/);

    await getStartedLink.click();
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByText(/Welcome back|С возвращением/i)).toBeVisible();
    await expect(
      page.getByText(/Login with your social account|Войдите через социальный аккаунт/i)
    ).toBeVisible();
  });
});
