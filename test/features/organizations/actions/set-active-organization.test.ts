/** @jest-environment node */

const mockSetActiveOrganization = jest.fn();
const mockHeaders = jest.fn();
const mockLoadCurrentUserId = jest.fn();
const mockLoadRequestHeaders = jest.fn();

jest.mock("@lib/logger", () => ({
  loggerFactory: {
    child: () => ({
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child() {
        return this;
      },
    }),
  },
}));

jest.mock("@components/errors/common-error", () => ({
  errors: {
    internalServerError: {
      success: false,
      error: {
        message: "500",
        code: 500,
      },
    },
  },
}));

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      setActiveOrganization: (...args: unknown[]) => mockSetActiveOrganization(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
  loadRequestHeaders: (...args: unknown[]) => mockLoadRequestHeaders(...args),
}));

jest.mock("next/navigation", () => ({
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import { setActiveOrganization } from "@features/organizations/actions/set-active-organization";

describe("setActiveOrganization", () => {
  beforeEach(() => {
    mockSetActiveOrganization.mockReset();
    mockHeaders.mockReset();
    mockLoadCurrentUserId.mockReset();
    mockLoadRequestHeaders.mockReset();

    mockHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockLoadRequestHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
  });

  it("stores active organization through Better Auth user context", async () => {
    const organizationId = "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H";

    await expect(setActiveOrganization({ organizationId })).resolves.toEqual({
      success: true,
      data: { organizationId },
    });

    expect(mockSetActiveOrganization).toHaveBeenCalledWith({
      body: { organizationId },
      headers: expect.any(Headers),
    });
  });

  it("rejects invalid organization ids before calling Better Auth", async () => {
    await expect(setActiveOrganization({ organizationId: "org_invalid" })).resolves.toEqual({
      success: false,
      error: {
        message: "Invalid ID",
        code: 400,
      },
    });

    expect(mockSetActiveOrganization).not.toHaveBeenCalled();
  });
});
