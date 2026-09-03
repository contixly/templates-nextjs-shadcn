/** @jest-environment node */

const mockCheckApplicationReadiness = jest.fn();

jest.mock("@server/readiness", () => ({
  checkApplicationReadiness: (...args: unknown[]) => mockCheckApplicationReadiness(...args),
}));

import { GET } from "../../src/app/api/health/ready/route";

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    mockCheckApplicationReadiness.mockReset();
  });

  test("returns 200 only when required dependencies are ready", async () => {
    mockCheckApplicationReadiness.mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "READY" });
  });

  test("returns a detail-free 503 when a dependency is unavailable", async () => {
    mockCheckApplicationReadiness.mockRejectedValue(new Error("secret connection detail"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "NOT_READY" });
  });
});
