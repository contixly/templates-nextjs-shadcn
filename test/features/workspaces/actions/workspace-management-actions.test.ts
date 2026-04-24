/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockFindManyAccessibleOrganizationsByUserId = jest.fn();
const mockCountAccessibleOrganizationsByUserId = jest.fn();
const mockFindWorkspaceDtoByIdAndUserId = jest.fn();
const mockFindFirstAccessibleOrganizationByIdAndUserId = jest.fn();
const mockFindOrganizationBySlug = jest.fn();
const mockGenerateOrganizationSlug = jest.fn();
const mockCreateOrganization = jest.fn();
const mockSetActiveOrganization = jest.fn();
const mockUpdateOrganization = jest.fn();
const mockDeleteOrganization = jest.fn();
const mockHasWorkspacePermission = jest.fn();
const mockHeaders = jest.fn();
const mockOrganizationUpdateMany = jest.fn();

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

jest.mock("@features/organizations/organizations-repository", () => ({
  findManyAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    mockFindManyAccessibleOrganizationsByUserId(...args),
  countAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    mockCountAccessibleOrganizationsByUserId(...args),
  findWorkspaceDtoByIdAndUserId: (...args: unknown[]) => mockFindWorkspaceDtoByIdAndUserId(...args),
  findFirstAccessibleOrganizationByIdAndUserId: (...args: unknown[]) =>
    mockFindFirstAccessibleOrganizationByIdAndUserId(...args),
  findOrganizationBySlug: (...args: unknown[]) => mockFindOrganizationBySlug(...args),
  generateOrganizationSlug: (...args: unknown[]) => mockGenerateOrganizationSlug(...args),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: (...args: unknown[]) => mockHasWorkspacePermission(...args),
}));

jest.mock("@server/auth", () => ({
  auth: {
    api: {
      createOrganization: (...args: unknown[]) => mockCreateOrganization(...args),
      setActiveOrganization: (...args: unknown[]) => mockSetActiveOrganization(...args),
      updateOrganization: (...args: unknown[]) => mockUpdateOrganization(...args),
      deleteOrganization: (...args: unknown[]) => mockDeleteOrganization(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("@server/prisma", () => ({
  __esModule: true,
  default: {
    organization: {
      updateMany: (...args: unknown[]) => mockOrganizationUpdateMany(...args),
    },
  },
}));

jest.mock("next/cache", () => ({
  updateTag: jest.fn(),
}));

jest.mock("@lib/cache", () => ({
  revalidateTags: jest.fn(),
  updateTags: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

import { loadUserWorkspaces } from "@features/workspaces/actions/load-user-workspaces";
import { createWorkspace } from "@features/workspaces/actions/create-workspace";
import { deleteWorkspace } from "@features/workspaces/actions/delete-workspace";
import { updateWorkspace } from "@features/workspaces/actions/update-workspace";

const ORGANIZATION_ID = "d6qzollaqro6y66v7j52bhqo";
const SECOND_ORGANIZATION_ID = "h6qzollaqro6y66v7j52bhqp";

describe("workspace management actions", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockFindManyAccessibleOrganizationsByUserId.mockReset();
    mockCountAccessibleOrganizationsByUserId.mockReset();
    mockFindWorkspaceDtoByIdAndUserId.mockReset();
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockReset();
    mockFindOrganizationBySlug.mockReset();
    mockGenerateOrganizationSlug.mockReset();
    mockCreateOrganization.mockReset();
    mockSetActiveOrganization.mockReset();
    mockUpdateOrganization.mockReset();
    mockDeleteOrganization.mockReset();
    mockHasWorkspacePermission.mockReset();
    mockHeaders.mockReset();
    mockOrganizationUpdateMany.mockReset();

    mockLoadCurrentUserId.mockResolvedValue("user-123");
    mockHasWorkspacePermission.mockResolvedValue(true);
    mockHeaders.mockResolvedValue(new Headers([["x-test", "1"]]));
  });

  it("loads workspaces from accessible organizations for the authenticated user", async () => {
    mockFindManyAccessibleOrganizationsByUserId.mockResolvedValue([
      {
        id: "org-1",
        name: "Acme",
        slug: "acme",
        logo: null,
        metadata: null,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-20T10:00:00.000Z"),
      },
    ]);

    await expect(loadUserWorkspaces()).resolves.toEqual({
      success: true,
      data: [
        expect.objectContaining({
          id: "org-1",
          name: "Acme",
          slug: "acme",
        }),
      ],
    });

    expect(mockFindManyAccessibleOrganizationsByUserId).toHaveBeenCalledWith("user-123");
  });

  it("creates a workspace by generating a slug, creating an organization, and updating active context", async () => {
    mockFindManyAccessibleOrganizationsByUserId.mockResolvedValue([]);
    mockGenerateOrganizationSlug.mockResolvedValue("acme-team");
    mockCreateOrganization.mockResolvedValue({ id: ORGANIZATION_ID });
    mockSetActiveOrganization.mockResolvedValue(undefined);
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Acme Team",
      slug: "acme-team",
      logo: null,
      metadata: null,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    });

    const result = await createWorkspace({
      name: "Acme Team",
    });

    expect(mockGenerateOrganizationSlug).toHaveBeenCalledWith("Acme Team");
    expect(mockCreateOrganization).toHaveBeenCalledWith({
      body: {
        name: "Acme Team",
        slug: "acme-team",
      },
      headers: expect.any(Headers),
    });
    expect(mockSetActiveOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
      },
      headers: expect.any(Headers),
    });
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: ORGANIZATION_ID,
        name: "Acme Team",
        slug: "acme-team",
      }),
    });
  });

  it("updates workspace settings without sending obsolete preference state", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Old Name",
      slug: "old-name",
    });
    mockFindManyAccessibleOrganizationsByUserId.mockResolvedValue([
      {
        id: ORGANIZATION_ID,
        name: "Old Name",
        slug: "old-name",
      },
      {
        id: SECOND_ORGANIZATION_ID,
        name: "Shared Workspace",
        slug: "shared",
      },
    ]);
    mockGenerateOrganizationSlug.mockResolvedValue("new-name");
    mockUpdateOrganization.mockResolvedValue(undefined);
    mockFindWorkspaceDtoByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "New Name",
      slug: "new-name",
      logo: null,
      metadata: null,
      createdAt: new Date("2026-04-20T10:00:00.000Z"),
      updatedAt: new Date("2026-04-20T10:00:00.000Z"),
    });

    const result = await updateWorkspace({
      id: ORGANIZATION_ID,
      name: "New Name",
    });

    expect(mockUpdateOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
        data: {
          name: "New Name",
          slug: "new-name",
        },
      },
      headers: expect.any(Headers),
    });
    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: ORGANIZATION_ID,
        name: "New Name",
        slug: "new-name",
      }),
    });
  });

  it("rejects an unavailable slug without updating the organization", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      slug: "primary",
    });
    mockFindManyAccessibleOrganizationsByUserId.mockResolvedValue([
      {
        id: ORGANIZATION_ID,
        name: "Primary Workspace",
        slug: "primary",
      },
      {
        id: SECOND_ORGANIZATION_ID,
        name: "Shared Workspace",
        slug: "shared",
      },
    ]);
    mockFindOrganizationBySlug.mockResolvedValue({
      id: SECOND_ORGANIZATION_ID,
    });

    const result = await updateWorkspace({
      id: ORGANIZATION_ID,
      slug: "shared",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "validation.errors.duplicateSlug",
        code: 409,
      },
    });
    expect(mockUpdateOrganization).not.toHaveBeenCalled();
  });

  it("rejects a slug used by an inaccessible organization without updating the organization", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      slug: "primary",
    });
    mockFindManyAccessibleOrganizationsByUserId.mockResolvedValue([
      {
        id: ORGANIZATION_ID,
        name: "Primary Workspace",
        slug: "primary",
      },
    ]);
    mockFindOrganizationBySlug.mockResolvedValue({
      id: "unrelated-org",
    });

    const result = await updateWorkspace({
      id: ORGANIZATION_ID,
      slug: "global-slug",
    });

    expect(mockFindOrganizationBySlug).toHaveBeenCalledWith("global-slug", { id: true });
    expect(result).toEqual({
      success: false,
      error: {
        message: "validation.errors.duplicateSlug",
        code: 409,
      },
    });
    expect(mockUpdateOrganization).not.toHaveBeenCalled();
  });

  it("rejects workspace updates when the current member lacks update permission", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      slug: "primary",
    });
    mockHasWorkspacePermission.mockResolvedValue(false);

    const result = await updateWorkspace({
      id: ORGANIZATION_ID,
      name: "Renamed Workspace",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "validation.errors.updatePermissionDenied",
        code: 403,
      },
    });
    expect(mockUpdateOrganization).not.toHaveBeenCalled();
  });

  it("rejects workspace deletion when the current member lacks delete permission", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
    });
    mockHasWorkspacePermission.mockResolvedValue(false);

    const result = await deleteWorkspace({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      confirmationText: "Primary Workspace",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "validation.errors.deletePermissionDenied",
        code: 403,
      },
    });
    expect(mockDeleteOrganization).not.toHaveBeenCalled();
  });

  it("rejects workspace deletion when it would remove the last accessible workspace", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
    });
    mockCountAccessibleOrganizationsByUserId.mockResolvedValue(1);

    const result = await deleteWorkspace({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      confirmationText: "Primary Workspace",
    });

    expect(result).toEqual({
      success: false,
      error: {
        message: "validation.errors.atLeastOneWorkspace",
        code: 400,
      },
    });
    expect(mockDeleteOrganization).not.toHaveBeenCalled();
  });

  it("deletes a workspace when the owner has permission, another workspace remains, and confirmation matches", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
    });
    mockCountAccessibleOrganizationsByUserId.mockResolvedValue(2);
    mockDeleteOrganization.mockResolvedValue(undefined);

    const result = await deleteWorkspace({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      confirmationText: "Primary Workspace",
    });

    expect(mockDeleteOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
      },
      headers: expect.any(Headers),
    });
    expect(result).toEqual({
      success: true,
      data: undefined,
    });
  });
});
