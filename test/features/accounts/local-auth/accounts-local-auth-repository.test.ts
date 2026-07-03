/** @jest-environment node */

const organizationFindManyMock = jest.fn();
const organizationDeleteManyMock = jest.fn();
const apiKeyDeleteManyMock = jest.fn();
const prismaTransactionMock = jest.fn();

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      findMany: (...args: unknown[]) => organizationFindManyMock(...args),
      deleteMany: (...args: unknown[]) => organizationDeleteManyMock(...args),
    },
    apiKey: {
      deleteMany: (...args: unknown[]) => apiKeyDeleteManyMock(...args),
    },
    $transaction: (...args: unknown[]) => prismaTransactionMock(...args),
  },
}));

import { API_KEY_ORGANIZATION_CONFIG_ID } from "@lib/api-key-config";
import {
  deleteMemberlessOrganizationsByIds,
  deleteSoleMemberOrganizationsForUser,
  findSoleMemberOrganizationIdsForUser,
} from "@features/accounts/accounts-local-auth-repository";

describe("accounts local automation auth repository", () => {
  beforeEach(() => {
    organizationFindManyMock.mockReset();
    organizationDeleteManyMock.mockReset();
    apiKeyDeleteManyMock.mockReset();
    prismaTransactionMock.mockReset();
    prismaTransactionMock.mockImplementation((callback) =>
      callback({
        organization: {
          findMany: (...args: unknown[]) => organizationFindManyMock(...args),
          deleteMany: (...args: unknown[]) => organizationDeleteManyMock(...args),
        },
        apiKey: {
          deleteMany: (...args: unknown[]) => apiKeyDeleteManyMock(...args),
        },
      })
    );
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

  it("deletes sole-member organizations for the user and skips empty delete batches", async () => {
    organizationDeleteManyMock.mockResolvedValue({ count: 2 });

    await expect(
      deleteSoleMemberOrganizationsForUser("user_1", ["org_1", "org_2"])
    ).resolves.toEqual({
      count: 2,
    });
    expect(organizationDeleteManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["org_1", "org_2"],
        },
        members: {
          some: {
            userId: "user_1",
          },
          every: {
            userId: "user_1",
          },
        },
      },
    });

    organizationDeleteManyMock.mockClear();
    await expect(deleteSoleMemberOrganizationsForUser("user_1", [])).resolves.toEqual({ count: 0 });
    expect(organizationDeleteManyMock).not.toHaveBeenCalled();
  });

  it("deletes organization API keys for actually deleted memberless organization ids", async () => {
    organizationFindManyMock.mockResolvedValue([{ id: "org_1" }, { id: "org_2" }]);
    organizationDeleteManyMock.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({
      count: 1,
    });
    apiKeyDeleteManyMock.mockResolvedValue({ count: 2 });

    await expect(deleteMemberlessOrganizationsByIds(["org_1", "org_2"])).resolves.toEqual({
      count: 2,
    });
    expect(prismaTransactionMock).toHaveBeenCalledTimes(1);
    expect(organizationFindManyMock).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["org_1", "org_2"],
        },
        members: {
          none: {},
        },
      },
      select: {
        id: true,
      },
    });
    expect(organizationDeleteManyMock).toHaveBeenNthCalledWith(1, {
      where: {
        id: "org_1",
        members: {
          none: {},
        },
      },
    });
    expect(organizationDeleteManyMock).toHaveBeenNthCalledWith(2, {
      where: {
        id: "org_2",
        members: {
          none: {},
        },
      },
    });
    expect(apiKeyDeleteManyMock).toHaveBeenCalledWith({
      where: {
        configId: API_KEY_ORGANIZATION_CONFIG_ID,
        referenceId: {
          in: ["org_1", "org_2"],
        },
      },
    });
    expect(organizationDeleteManyMock.mock.invocationCallOrder[1]).toBeLessThan(
      apiKeyDeleteManyMock.mock.invocationCallOrder[0]
    );
  });

  it("does not delete organization API keys for candidates whose organization delete count is zero", async () => {
    organizationFindManyMock.mockResolvedValue([{ id: "org_1" }, { id: "org_2" }]);
    organizationDeleteManyMock.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({
      count: 0,
    });
    apiKeyDeleteManyMock.mockResolvedValue({ count: 1 });

    await expect(deleteMemberlessOrganizationsByIds(["org_1", "org_2"])).resolves.toEqual({
      count: 1,
    });

    expect(apiKeyDeleteManyMock).toHaveBeenCalledWith({
      where: {
        configId: API_KEY_ORGANIZATION_CONFIG_ID,
        referenceId: {
          in: ["org_1"],
        },
      },
    });
  });

  it("does not delete organization API keys when no candidates are actually deleted", async () => {
    organizationFindManyMock.mockResolvedValue([{ id: "org_1" }]);
    organizationDeleteManyMock.mockResolvedValue({ count: 0 });

    await expect(deleteMemberlessOrganizationsByIds(["org_1"])).resolves.toEqual({
      count: 0,
    });

    expect(apiKeyDeleteManyMock).not.toHaveBeenCalled();
    expect(prismaTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("skips memberless organization deletion for empty batches", async () => {
    await expect(deleteMemberlessOrganizationsByIds([])).resolves.toEqual({ count: 0 });

    expect(prismaTransactionMock).not.toHaveBeenCalled();
    expect(organizationDeleteManyMock).not.toHaveBeenCalled();
    expect(apiKeyDeleteManyMock).not.toHaveBeenCalled();
  });
});
