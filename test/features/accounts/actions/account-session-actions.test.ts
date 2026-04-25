/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockLoadCurrentSession = jest.fn();
const mockLoadRequestHeaders = jest.fn();
const mockHeaders = jest.fn();
const mockRevokeSession = jest.fn();
const mockRevalidatePath = jest.fn();
const mockSessionFindFirst = jest.fn();

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
  loadCurrentSession: (...args: unknown[]) => mockLoadCurrentSession(...args),
  loadRequestHeaders: (...args: unknown[]) => mockLoadRequestHeaders(...args),
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

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    session: {
      findFirst: (...args: unknown[]) => mockSessionFindFirst(...args),
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
    mockLoadCurrentSession.mockReset();
    mockLoadRequestHeaders.mockReset();
    mockHeaders.mockReset();
    mockRevokeSession.mockReset();
    mockRevalidatePath.mockReset();
    mockSessionFindFirst.mockReset();

    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockLoadCurrentSession.mockResolvedValue({ id: "currentSession" });
    mockLoadRequestHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
    mockRevokeSession.mockResolvedValue(undefined);
    mockSessionFindFirst.mockResolvedValue({ token: "server-side-token" });
  });

  it("revokes a session by resolving the Better Auth token server-side", async () => {
    const result = await revokeSession("otherSession");

    expect(mockSessionFindFirst).toHaveBeenCalledWith({
      where: {
        id: "otherSession",
        userId: "user-123",
      },
      select: {
        token: true,
      },
    });
    expect(mockRevokeSession).toHaveBeenCalledWith({
      body: { token: "server-side-token" },
      headers: expect.any(Headers),
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(routes.accounts.pages.security.path());
    expect(result).toEqual({ success: true });
  });

  it("does not revoke the current session through the other-session action", async () => {
    const result = await revokeSession("currentSession");

    expect(mockSessionFindFirst).not.toHaveBeenCalled();
    expect(mockRevokeSession).not.toHaveBeenCalled();
    expect(result).toEqual({
      success: false,
      error: {
        message: "Cannot revoke the current session from this action.",
        code: 409,
      },
    });
  });
});
