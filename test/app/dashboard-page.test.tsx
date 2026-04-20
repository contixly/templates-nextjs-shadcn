import routes from "../../src/features/routes";
import accountsRoutes from "../../src/features/accounts/accounts-routes";
import { loadCurrentSession, loadCurrentUserId } from "@features/accounts/accounts-actions";
import {
  findDefaultOrganizationByUserId,
  findFirstAccessibleOrganizationForUser,
  findManyAccessibleOrganizationsByUserId,
} from "@features/organizations/organizations-repository";

jest.mock("../../src/features/accounts/accounts-actions", () => ({
  loadCurrentSession: jest.fn(),
  loadCurrentUserId: jest.fn(),
}));

jest.mock("../../src/features/organizations/organizations-repository", () => ({
  findDefaultOrganizationByUserId: jest.fn(),
  findFirstAccessibleOrganizationForUser: jest.fn(),
  findManyAccessibleOrganizationsByUserId: jest.fn(),
}));

jest.mock("../../src/lib/metadata", () => ({
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
    (findDefaultOrganizationByUserId as jest.Mock).mockReset();
    (findFirstAccessibleOrganizationForUser as jest.Mock).mockReset();
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockReset();
  });

  it("redirects to the active organization dashboard when the session organization is accessible", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: "org-2" });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
      { id: "org-1" },
      { id: "org-2" },
    ]);
    (findDefaultOrganizationByUserId as jest.Mock).mockResolvedValue({ id: "org-1" });
    (findFirstAccessibleOrganizationForUser as jest.Mock).mockResolvedValue({ id: "org-1" });

    const pageModule = await import("../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationId: "org-2",
      })}`
    );
  });

  it("falls back to the default organization dashboard when the session organization is invalid", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: "missing-org" });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
      { id: "org-1" },
      { id: "org-2" },
    ]);
    (findDefaultOrganizationByUserId as jest.Mock).mockResolvedValue({ id: "org-1" });
    (findFirstAccessibleOrganizationForUser as jest.Mock).mockResolvedValue({ id: "org-2" });

    const pageModule = await import("../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationId: "org-1",
      })}`
    );
  });

  it("falls back deterministically to the first accessible organization when no active or default organization exists", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: null });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
      { id: "org-2" },
      { id: "org-3" },
    ]);
    (findDefaultOrganizationByUserId as jest.Mock).mockResolvedValue(null);
    (findFirstAccessibleOrganizationForUser as jest.Mock).mockResolvedValue({ id: "org-2" });

    const pageModule = await import("../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationId: "org-2",
      })}`
    );
  });

  it("redirects to welcome when the user has no accessible organizations", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (loadCurrentSession as jest.Mock).mockResolvedValue({ activeOrganizationId: null });
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([]);
    (findDefaultOrganizationByUserId as jest.Mock).mockResolvedValue(null);
    (findFirstAccessibleOrganizationForUser as jest.Mock).mockResolvedValue(null);

    const pageModule = await import("../../src/app/(protected)/(global)/dashboard/page");

    await expect(pageModule.default()).rejects.toThrow(
      `redirect:${accountsRoutes.pages.welcome.path()}`
    );
  });
});
