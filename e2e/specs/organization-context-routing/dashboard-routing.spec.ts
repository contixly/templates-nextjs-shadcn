import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "../../support/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { routes } from "../../support/routes";
import { createWorkspaceThroughUI } from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const expectOnboardingGuardVisible = async (page: Page) => {
  await expect(page.getByText("Create your first workspace")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Workspace" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review Invitations" })).toBeVisible();
};

const expectPngPreview = async (request: APIRequestContext, imageUrl: string) => {
  const response = await request.get(imageUrl);

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");

  const body = await response.body();

  expect(body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(body.readUInt32BE(16)).toBe(1200);
  expect(body.readUInt32BE(20)).toBe(630);
};

const expectSocialPreviewImages = async (
  page: Page,
  request: APIRequestContext,
  organizationKey: string
) => {
  const openGraphImage = page.locator('meta[property="og:image"]');
  const twitterImage = page.locator('meta[name="twitter:image"]');

  await expect(openGraphImage).toHaveCount(1);
  await expect(twitterImage).toHaveCount(1);
  await expect(openGraphImage).toHaveAttribute("content", /^https?:\/\//);
  await expect(twitterImage).toHaveAttribute("content", /^https?:\/\//);

  const openGraphImageUrl = await openGraphImage.getAttribute("content");
  const twitterImageUrl = await twitterImage.getAttribute("content");

  expect(openGraphImageUrl).not.toBeNull();
  expect(twitterImageUrl).not.toBeNull();
  expect(new URL(openGraphImageUrl!).pathname).toMatch(
    new RegExp(`^/w/${organizationKey}/dashboard/opengraph-image-[^/]+$`)
  );
  expect(new URL(twitterImageUrl!).pathname).toMatch(
    new RegExp(`^/w/${organizationKey}/dashboard/twitter-image-[^/]+$`)
  );

  await expectPngPreview(request, openGraphImageUrl!);
  await expectPngPreview(request, twitterImageUrl!);
};

test.describe("organization-context-routing: dashboard routing", () => {
  test("redirects zero-workspace users from dashboard to welcome onboarding", async ({ page }) => {
    await signInLocalAutomationUser(page, {
      name: "E2E Routing Zero Workspace",
    });

    try {
      await page.goto(routes.dashboard);

      await expect(page).toHaveURL(routes.welcome);
      await expectOnboardingGuardVisible(page);
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("redirects dashboard and workspace root to the accessible workspace dashboard", async ({
    page,
    request,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Routing Workspace Owner",
    });

    try {
      const organizationKey = await createWorkspaceThroughUI(
        page,
        `E2E Routing ${Date.now().toString(36)}`
      );

      await page.goto(routes.dashboard);
      await expect(page).toHaveURL(routes.organizationDashboard(organizationKey));
      await expectSocialPreviewImages(page, request, organizationKey);

      await page.goto(routes.workspace(organizationKey));
      await expect(page).toHaveURL(routes.organizationDashboard(organizationKey));
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("renders forbidden UI for inaccessible workspace roots when the user has workspaces", async ({
    page,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E Routing Forbidden Owner",
    });

    try {
      await createWorkspaceThroughUI(page, `E2E Routing Forbidden ${Date.now().toString(36)}`);

      await page.goto(routes.workspace("missing-e2e-workspace"));

      await expect(page.getByText("403")).toBeVisible();
      await expect(page.getByText("Oops! You are not authorized!")).toBeVisible();
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
