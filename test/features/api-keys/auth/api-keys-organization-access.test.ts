/** @jest-environment node */

const memberFindFirstMock = jest.fn();

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      verifyApiKey: jest.fn(),
    },
  },
}));

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    member: {
      findFirst: (...args: unknown[]) => memberFindFirstMock(...args),
    },
  },
}));

jest.mock("@features/api-keys/api-keys-logger", () => ({
  apiKeysLogger: {
    child: jest.fn(() => ({
      error: jest.fn(),
    })),
  },
}));

import { requireApiOrganizationAccess } from "@features/api-keys/api-keys-auth";

describe("requireApiOrganizationAccess", () => {
  beforeEach(() => {
    memberFindFirstMock.mockReset();
  });

  it("allows user keys for organizations where the owner is a member", async () => {
    memberFindFirstMock.mockResolvedValue({ id: "member_1" });

    await expect(
      requireApiOrganizationAccess(
        {
          type: "user",
          keyId: "key_1",
          keyStart: "user_s",
          configId: "user-keys",
          userId: "user_1",
          permissions: { organization: ["read"] },
        },
        "org_1"
      )
    ).resolves.toEqual({ organizationId: "org_1" });

    expect(memberFindFirstMock).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        userId: "user_1",
      },
      select: {
        id: true,
      },
    });
  });

  it("rejects user keys when the owner is not a member", async () => {
    memberFindFirstMock.mockResolvedValue(null);

    await expect(
      requireApiOrganizationAccess(
        {
          type: "user",
          keyId: "key_1",
          keyStart: "user_s",
          configId: "user-keys",
          userId: "user_1",
          permissions: { organization: ["read"] },
        },
        "org_1"
      )
    ).rejects.toMatchObject({
      status: 403,
      code: "organization_access_denied",
    });
  });

  it("allows organization keys only for their own organization", async () => {
    await expect(
      requireApiOrganizationAccess(
        {
          type: "organization",
          keyId: "key_2",
          keyStart: "org_s",
          configId: "org-keys",
          organizationId: "org_1",
          permissions: { organization: ["read"] },
        },
        "org_1"
      )
    ).resolves.toEqual({ organizationId: "org_1" });

    await expect(
      requireApiOrganizationAccess(
        {
          type: "organization",
          keyId: "key_2",
          keyStart: "org_s",
          configId: "org-keys",
          organizationId: "org_1",
          permissions: { organization: ["read"] },
        },
        "org_2"
      )
    ).rejects.toMatchObject({
      status: 403,
      code: "organization_access_denied",
    });
  });
});
