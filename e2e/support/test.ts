import { expect, test as base } from "@playwright/test";

const isFirstPartyResponse = (
  responseUrl: string,
  baseURL: string | undefined,
): boolean => {
  if (!baseURL) return false;

  try {
    return new URL(responseUrl).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
};

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    page.on("response", (response) => {
      if (
        response.status() >= 500 &&
        isFirstPartyResponse(response.url(), testInfo.project.use.baseURL)
      ) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await use(page);

    expect(pageErrors, "uncaught page errors").toEqual([]);
    expect(serverErrors, "first-party server errors").toEqual([]);
  },
});

export { expect };
