/** @jest-environment node */

const cacheLifeMock = jest.fn();
const cacheTagMock = jest.fn();

const findManyMock = jest.fn();
const findFirstMock = jest.fn();

jest.mock("next/cache", () => ({
  cacheLife: (...args: unknown[]) => cacheLifeMock(...args),
  cacheTag: (...args: unknown[]) => cacheTagMock(...args),
}));

jest.mock("../../src/server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findMany: (...args: unknown[]) => findManyMock(...args),
      findFirst: (...args: unknown[]) => findFirstMock(...args),
    },
  },
}));

jest.mock("../../src/features/organizations/organizations-logger", () => ({
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
  findDefaultOrganizationByUserId,
  findFirstAccessibleOrganizationByIdAndUserId,
  findFirstAccessibleOrganizationByKeyAndUserId,
  findManyAccessibleOrganizationsByUserId,
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
  });

  it("tags accessible organization lists by user and returned organization ids", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "org_1",
        name: "Acme",
        slug: "acme",
        logo: null,
        metadata: null,
        isDefault: true,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
      {
        id: "org_2",
        name: "Beta",
        slug: "beta",
        logo: null,
        metadata: null,
        isDefault: false,
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

  it("keeps user scoped invalidation for default-organization lookups even when none exists", async () => {
    findFirstMock.mockResolvedValue(null);

    await findDefaultOrganizationByUserId("user_1");

    expect(cacheTagMock).toHaveBeenCalledWith(CACHE_OrganizationsByUserIdTag("user_1"));
  });
});
