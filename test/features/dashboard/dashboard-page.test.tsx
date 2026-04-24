import routes from "@features/routes";
import accountsRoutes from "@features/accounts/accounts-routes";
import { loadCurrentSession, loadCurrentUserId } from "@features/accounts/accounts-actions";
import { findManyAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentSession: jest.fn(),
  loadCurrentUserId: jest.fn(),
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  findManyAccessibleOrganizationsByUserId: jest.fn(),
}));

jest.mock("@lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Dashboard" })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

describe("global dashboard redirect route", () => {
  beforeEach(() => {
    (loadCurrentSession as jest.Mock).mockReset();
    (loadCurrentUserId as jest.Mock).mockReset();
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockReset();
  });

  it("redirects to the active organization dashboard when the session organization is accessible", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: "org-2" });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
      { id: "org-1", slug: "alpha-workspace" },
      { id: "org-2", slug: "client-workspace" },
    ]);

    const pageModule = await import("../../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationKey: "client-workspace",
      })}`
    );
  });

  it("falls back deterministically to the first accessible organization when the session organization is invalid", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: "missing-org" });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
      { id: "org-1", slug: "alpha-workspace" },
      { id: "org-2", slug: "client-workspace" },
    ]);

    const pageModule = await import("../../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationKey: "alpha-workspace",
      })}`
    );
  });

  it("falls back deterministically to the first accessible organization when no active organization exists", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: null });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
      { id: "org-2", slug: "client-workspace" },
      { id: "org-3", slug: null },
    ]);

    const pageModule = await import("../../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationKey: "client-workspace",
      })}`
    );
  });

  it("redirects to welcome when the user has no accessible organizations", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: null });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([]);

    const pageModule = await import("../../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${accountsRoutes.pages.welcome.path()}`
    );
  });
});
