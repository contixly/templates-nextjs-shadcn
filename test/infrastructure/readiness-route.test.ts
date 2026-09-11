/** @jest-environment node */

const mockCheckApplicationReadiness = jest.fn();
const mockConnection = jest.fn();

jest.mock("next/server", () => ({
  connection: (...args: unknown[]) => mockConnection(...args),
}));

jest.mock("@server/readiness", () => ({
  checkApplicationReadiness: (...args: unknown[]) => mockCheckApplicationReadiness(...args),
}));

import { GET } from "../../src/app/api/health/ready/route";

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    mockCheckApplicationReadiness.mockReset();
    mockConnection.mockReset();
    mockConnection.mockResolvedValue(undefined);
  });

  test("returns 200 only when required dependencies are ready", async () => {
    mockCheckApplicationReadiness.mockResolvedValue(undefined);

    const response = await GET();

    expect(mockConnection).toHaveBeenCalledTimes(1);
    expect(mockConnection.mock.invocationCallOrder[0]).toBeLessThan(
      mockCheckApplicationReadiness.mock.invocationCallOrder[0]
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "READY" });
  });

  test("returns a detail-free 503 when a dependency is unavailable", async () => {
    mockCheckApplicationReadiness.mockRejectedValue(new Error("secret connection detail"));

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "NOT_READY" });
  });

  test("does not swallow Next.js prerendering control flow", async () => {
    const prerenderSignal = new Error("prerender interrupted");
    mockConnection.mockRejectedValue(prerenderSignal);

    await expect(GET()).rejects.toBe(prerenderSignal);
    expect(mockCheckApplicationReadiness).not.toHaveBeenCalled();
  });
});
