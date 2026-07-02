import { expect, test as base } from "@playwright/test";

const COLD_ROUTE_RETRY_ATTEMPTS = 3;
const COLD_ROUTE_RETRY_DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isFirstPartyResponse = (responseUrl: string, baseURL: string | undefined): boolean => {
  if (!baseURL) return false;

  try {
    return new URL(responseUrl).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
};

export const test = base.extend({
  page: async ({ page }, run, testInfo) => {
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];
    const originalGoto = page.goto.bind(page);

    page.goto = (async (url, options) => {
      let response = await originalGoto(url, options);

      for (
        let attempt = 1;
        response?.status() === 404 &&
        isFirstPartyResponse(response.url(), testInfo.project.use.baseURL) &&
        attempt < COLD_ROUTE_RETRY_ATTEMPTS;
        attempt += 1
      ) {
        await delay(COLD_ROUTE_RETRY_DELAY_MS * attempt);
        response = await originalGoto(url, options);
      }

      return response;
    }) as typeof page.goto;

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

    await run(page);

    expect(pageErrors, "uncaught page errors").toEqual([]);
    expect(serverErrors, "first-party server errors").toEqual([]);
  },
});

export { expect };
