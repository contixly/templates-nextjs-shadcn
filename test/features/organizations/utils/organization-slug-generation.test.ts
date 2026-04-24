/** @jest-environment node */

const mockFindUnique = jest.fn();

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

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import { generateOrganizationSlug } from "@features/organizations/organizations-repository";

describe("generateOrganizationSlug", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("deduplicates slug collisions deterministically until an unused slug is found", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "org-1" })
      .mockResolvedValueOnce({ id: "org-2" })
      .mockResolvedValueOnce(null);

    await expect(generateOrganizationSlug("Acme Team")).resolves.toBe("acme-team-3");

    expect(mockFindUnique).toHaveBeenNthCalledWith(1, {
      where: { slug: "acme-team" },
      select: { id: true },
    });
    expect(mockFindUnique).toHaveBeenNthCalledWith(2, {
      where: { slug: "acme-team-2" },
      select: { id: true },
    });
    expect(mockFindUnique).toHaveBeenNthCalledWith(3, {
      where: { slug: "acme-team-3" },
      select: { id: true },
    });
  });
});
