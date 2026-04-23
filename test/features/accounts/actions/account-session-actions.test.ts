/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockHeaders = jest.fn();
const mockRevokeSession = jest.fn();
const mockRevalidatePath = jest.fn();

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

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
}));

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      revokeSession: (...args: unknown[]) => mockRevokeSession(...args),
    },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

jest.mock("next/navigation", () => ({
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import routes from "@features/routes";
import { revokeSession } from "@features/accounts/actions/revoke-session";

describe("account session actions", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockHeaders.mockReset();
    mockRevokeSession.mockReset();
    mockRevalidatePath.mockReset();

    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockRevokeSession.mockResolvedValue(undefined);
  });

  it("revokes a session using the raw better-auth session token instead of cuid validation", async () => {
    const token = "n9i4d0Vh7n2k2D1lVwQF6eM2xq8r0YpA";

    const result = await revokeSession(token);

    expect(mockRevokeSession).toHaveBeenCalledWith({
      body: { token },
      headers: expect.any(Headers),
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(routes.accounts.pages.security.path());
    expect(result).toEqual({ success: true });
  });
});
