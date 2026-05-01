/** @jest-environment node */

const cacheLifeMock = jest.fn();
const cacheTagMock = jest.fn();

const findManyMock = jest.fn();
const findFirstMock = jest.fn();
const memberFindFirstMock = jest.fn();

jest.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => cacheLifeMock(...args),
  cacheTag: (...args: unknown[]) => cacheTagMock(...args),
}));

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
    member: {
      findFirst: (...args: unknown[]) => memberFindFirstMock(...args),
    },
  },
}));

jest.mock("@features/organizations/organizations-logger", () => ({
  organizationsLogger: {
    child: () => ({
      child: () => ({
        debug: jest.fn(),
      }),
      debug: jest.fn(),
    }),
  },
}));

import {
  findFirstAccessibleOrganizationByIdAndUserId,
  findFirstAccessibleOrganizationByKeyAndUserId,
  findManyAccessibleOrganizationsByUserId,
  findOrganizationMemberByOrganizationIdAndUserId,
} from "@features/organizations/organizations-repository";
import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationsByUserIdTag,
} from "@features/organizations/organizations-types";

describe("organization repository cache tags", () => {
  beforeEach(() => {
    cacheLifeMock.mockReset();
    cacheTagMock.mockReset();
    findManyMock.mockReset();
    findFirstMock.mockReset();
    memberFindFirstMock.mockReset();
  });

  it("tags accessible organization lists by user and returned organization ids", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "org_1",
        name: "Acme",
        slug: "acme",
        logo: null,
        metadata: null,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
      {
        id: "org_2",
        name: "Beta",
        slug: "beta",
        logo: null,
        metadata: null,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
    ]);

    await findManyAccessibleOrganizationsByUserId("user_1");

    expect(cacheLifeMock).toHaveBeenCalledWith("hours");
    expect(cacheTagMock).toHaveBeenCalledWith(
      CACHE_OrganizationsByUserIdTag("user_1"),
      CACHE_OrganizationByIdTag("org_1"),
      CACHE_OrganizationByIdTag("org_2")
    );
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ name: "asc" }, { id: "asc" }],
      })
    );
    expect(findManyMock.mock.calls[0]?.[0]?.select).not.toHaveProperty("is" + "Default");
  });

  it("tags organization lookups by id with both the user scope and organization scope", async () => {
    findFirstMock.mockResolvedValue({ id: "org_1", slug: "acme" });

    await findFirstAccessibleOrganizationByIdAndUserId("org_1", "user_1", { slug: true });

    expect(cacheTagMock).toHaveBeenCalledWith(
      CACHE_OrganizationsByUserIdTag("user_1"),
      CACHE_OrganizationByIdTag("org_1")
    );
  });

  it("tags lookups by route key with the user scope and the resolved organization scope", async () => {
    findFirstMock.mockResolvedValue({ id: "org_1", slug: "acme" });

    await findFirstAccessibleOrganizationByKeyAndUserId("acme", "user_1", { name: true });

    expect(cacheTagMock).toHaveBeenCalledWith(
      CACHE_OrganizationsByUserIdTag("user_1"),
      CACHE_OrganizationByIdTag("org_1")
    );
  });

  it("queries the first accessible organization with deterministic ordering", async () => {
    findFirstMock.mockResolvedValue(null);

    const { findFirstAccessibleOrganizationForUser } =
      await import("@features/organizations/organizations-repository");

    await findFirstAccessibleOrganizationForUser("user_1");

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ name: "asc" }, { id: "asc" }],
      })
    );
    expect(findFirstMock.mock.calls[0]?.[0]?.select).not.toHaveProperty("is" + "Default");
    expect(cacheTagMock).toHaveBeenCalledWith(CACHE_OrganizationsByUserIdTag("user_1"));
  });

  it("loads authorization-sensitive organization member records without cross-request caching", async () => {
    memberFindFirstMock.mockResolvedValue({
      id: "member_1",
      organizationId: "org_1",
      userId: "user_1",
      role: "owner",
    });

    await expect(
      findOrganizationMemberByOrganizationIdAndUserId("org_1", "user_1", { role: true })
    ).resolves.toMatchObject({
      id: "member_1",
      role: "owner",
    });

    expect(memberFindFirstMock).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        userId: "user_1",
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
      },
    });
    expect(cacheLifeMock).not.toHaveBeenCalled();
    expect(cacheTagMock).not.toHaveBeenCalled();
  });
});
