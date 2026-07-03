import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";

type HeaderMap = Record<string, string>;

const expectBaselineSecurityHeaders = (headers: HeaderMap) => {
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  const permissionsPolicy = headers["permissions-policy"];
  expect(permissionsPolicy).toContain("camera=()");
  expect(permissionsPolicy).toContain("microphone=()");
  expect(permissionsPolicy).toContain("geolocation=()");

  const contentSecurityPolicy = headers["content-security-policy"];
  expect(contentSecurityPolicy).toContain("base-uri 'self'");
  expect(contentSecurityPolicy).toContain("object-src 'none'");
  expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
};

test.describe("application-runtime-security: security headers", () => {
  test("sets baseline browser security headers on page and API responses", async ({ page }) => {
    const pageResponse = await page.request.get(routes.home);
    expect(pageResponse.status()).toBe(200);
    expectBaselineSecurityHeaders(pageResponse.headers());

    const apiResponse = await page.request.get(routes.apiV1Me);
    expect(apiResponse.status()).toBe(401);
    const apiBody = await apiResponse.json();
    expect(apiBody).toMatchObject({
      error: {
        code: "api_key_missing",
      },
    });
    expectBaselineSecurityHeaders(apiResponse.headers());
  });
});
