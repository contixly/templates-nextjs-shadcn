/** @jest-environment node */

const organizationFindManyMock = jest.fn();
const organizationDeleteManyMock = jest.fn();

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findMany: (...args: unknown[]) => organizationFindManyMock(...args),
      deleteMany: (...args: unknown[]) => organizationDeleteManyMock(...args),
    },
  },
}));

import {
  deleteOrganizationsByIds,
  findSoleMemberOrganizationIdsForUser,
} from "@features/accounts/accounts-local-auth-repository";

describe("accounts local automation auth repository", () => {
  beforeEach(() => {
    organizationFindManyMock.mockReset();
    organizationDeleteManyMock.mockReset();
  });

  it("finds organizations where the user is the only member", async () => {
    organizationFindManyMock.mockResolvedValue([
      { id: "org_solo", _count: { members: 1 } },
      { id: "org_shared", _count: { members: 2 } },
    ]);

    await expect(findSoleMemberOrganizationIdsForUser("user_1")).resolves.toEqual(["org_solo"]);
    expect(organizationFindManyMock).toHaveBeenCalledWith({
      where: {
        members: {
          some: {
            userId: "user_1",
          },
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  });

  it("deletes organizations by id and skips empty delete batches", async () => {
    organizationDeleteManyMock.mockResolvedValue({ count: 2 });

    await expect(deleteOrganizationsByIds(["org_1", "org_2"])).resolves.toEqual({ count: 2 });
    expect(organizationDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["org_1", "org_2"],
        },
      },
    });

    organizationDeleteManyMock.mockClear();
    await expect(deleteOrganizationsByIds([])).resolves.toEqual({ count: 0 });
    expect(organizationDeleteManyMock).not.toHaveBeenCalled();
  });
});
