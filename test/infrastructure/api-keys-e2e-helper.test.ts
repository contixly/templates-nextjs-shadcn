/** @jest-environment node */

import type { APIResponse, Page } from "@playwright/test";
import { callApiV1WithKey } from "../../e2e/support/api-keys";

const createApiResponse = (options: { status: number; body: string; url?: string }): APIResponse =>
  ({
    status: jest.fn(() => options.status),
    text: jest.fn(async () => options.body),
    url: jest.fn(() => options.url ?? "http://127.0.0.1:3127/api/v1/test"),
  }) as unknown as APIResponse;

const createPage = (...responses: APIResponse[]) => {
  const get = jest.fn();

  for (const response of responses) {
    get.mockResolvedValueOnce(response);
  }

  return {
    page: {
      request: {
        get,
      },
    } as unknown as Page,
    get,
  };
};

describe("callApiV1WithKey", () => {
  it("retries first-hit HTML 404 responses before parsing JSON", async () => {
    const route = "/api/v1/organizations/org_1/teams/team_1/members";
    const firstResponse = createApiResponse({
      status: 404,
      body: "<!doctype html><html><body>Not Found</body></html>",
    });
    const secondResponse = createApiResponse({
      status: 200,
      body: JSON.stringify({ data: [{ id: "member_1" }] }),
    });
    const { page, get } = createPage(firstResponse, secondResponse);

    const result = await callApiV1WithKey<{ data: { id: string }[] }>(page, route, "api_secret");

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ data: [{ id: "member_1" }] });
    expect(result.response).toBe(secondResponse);
    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, route, {
      headers: {
        "x-api-key": "api_secret",
      },
    });
    expect(get).toHaveBeenNthCalledWith(2, route, {
      headers: {
        "x-api-key": "api_secret",
      },
    });
  });

  it("does not retry JSON 404 API responses", async () => {
    const response = createApiResponse({
      status: 404,
      body: JSON.stringify({
        error: {
          code: "not_found",
          message: "Not found",
        },
      }),
    });
    const { page, get } = createPage(response);

    const result = await callApiV1WithKey(page, "/api/v1/missing", "api_secret");

    expect(result.status).toBe(404);
    expect(result.body).toEqual({
      error: {
        code: "not_found",
        message: "Not found",
      },
    });
    expect(result.response).toBe(response);
    expect(get).toHaveBeenCalledTimes(1);
  });
});
