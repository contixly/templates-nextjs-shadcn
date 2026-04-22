/** @jest-environment node */

const mockLoadCurrentUserId = jest.fn();
const mockFindManyAccessibleOrganizationsByUserId = jest.fn();
const mockFindWorkspaceDtoByIdAndUserId = jest.fn();
const mockFindFirstAccessibleOrganizationByIdAndUserId = jest.fn();
const mockGenerateOrganizationSlug = jest.fn();
const mockCreateOrganization = jest.fn();
const mockSetActiveOrganization = jest.fn();
const mockUpdateOrganization = jest.fn();
const mockHeaders = jest.fn();
const mockOrganizationUpdateMany = jest.fn();

jest.mock("../../src/lib/logger", () => ({
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

jest.mock("../../src/components/errors/common-error", () => ({
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

jest.mock("../../src/features/accounts/accounts-actions", () => ({
  loadCurrentUserId: (...args: unknown[]) => mockLoadCurrentUserId(...args),
}));

jest.mock("../../src/features/organizations/organizations-repository", () => ({
  findManyAccessibleOrganizationsByUserId: (...args: unknown[]) =>
    mockFindManyAccessibleOrganizationsByUserId(...args),
  findWorkspaceDtoByIdAndUserId: (...args: unknown[]) => mockFindWorkspaceDtoByIdAndUserId(...args),
  findFirstAccessibleOrganizationByIdAndUserId: (...args: unknown[]) =>
    mockFindFirstAccessibleOrganizationByIdAndUserId(...args),
  generateOrganizationSlug: (...args: unknown[]) => mockGenerateOrganizationSlug(...args),
}));

jest.mock("../../src/server/auth", () => ({
  auth: {
    api: {
      createOrganization: (...args: unknown[]) => mockCreateOrganization(...args),
      setActiveOrganization: (...args: unknown[]) => mockSetActiveOrganization(...args),
      updateOrganization: (...args: unknown[]) => mockUpdateOrganization(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: (...args: unknown[]) => mockHeaders(...args),
}));

jest.mock("../../src/server/prisma", () => ({
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

jest.mock("../../src/lib/cache", () => ({
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
import { updateWorkspace } from "@features/workspaces/actions/update-workspace";

const ORGANIZATION_ID = "d6qzollaqro6y66v7j52bhqo";
const SECOND_ORGANIZATION_ID = "h6qzollaqro6y66v7j52bhqp";

describe("workspace management actions", () => {
  beforeEach(() => {
    mockLoadCurrentUserId.mockReset();
    mockFindManyAccessibleOrganizationsByUserId.mockReset();
    mockFindWorkspaceDtoByIdAndUserId.mockReset();
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockReset();
    mockGenerateOrganizationSlug.mockReset();
    mockCreateOrganization.mockReset();
    mockSetActiveOrganization.mockReset();
    mockUpdateOrganization.mockReset();
    mockHeaders.mockReset();
    mockOrganizationUpdateMany.mockReset();

    mockLoadCurrentUserId.mockResolvedValue("user-123");
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
        isDefault: true,
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
      isDefault: false,
    });

    const result = await createWorkspace({
      name: "Acme Team",
      isDefault: false,
    });

    expect(mockGenerateOrganizationSlug).toHaveBeenCalledWith("Acme Team");
    expect(mockCreateOrganization).toHaveBeenCalledWith({
      body: {
        name: "Acme Team",
        slug: "acme-team",
        isDefault: false,
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

  it("updates workspace settings when renaming and marking a workspace as default", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Old Name",
      slug: "old-name",
      isDefault: false,
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
    mockOrganizationUpdateMany.mockResolvedValue({ count: 1 });
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
      isDefault: true,
    });

    const result = await updateWorkspace({
      id: ORGANIZATION_ID,
      name: "New Name",
      isDefault: true,
    });

    expect(mockOrganizationUpdateMany).toHaveBeenCalledWith({
      where: {
        id: {
          not: ORGANIZATION_ID,
        },
        isDefault: true,
        members: {
          some: {
            userId: "user-123",
          },
        },
      },
      data: {
        isDefault: false,
      },
    });
    expect(mockUpdateOrganization).toHaveBeenCalledWith({
      body: {
        organizationId: ORGANIZATION_ID,
        data: {
          name: "New Name",
          slug: "new-name",
          isDefault: true,
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
        isDefault: true,
      }),
    });
  });

  it("rejects an unavailable slug without updating the organization", async () => {
    mockFindFirstAccessibleOrganizationByIdAndUserId.mockResolvedValue({
      id: ORGANIZATION_ID,
      name: "Primary Workspace",
      slug: "primary",
      isDefault: false,
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
});
