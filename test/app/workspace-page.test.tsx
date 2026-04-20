import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import routes from "../../src/features/routes";
import { OrganizationRouteGuard } from "../../src/features/organizations/components/organization-route-guard";

jest.mock("../../src/features/organizations/components/organization-route-guard", () => ({
  OrganizationRouteGuard: jest.fn(
    ({ organizationId, children }: { organizationId: string; children: React.ReactNode }) => {
      if (organizationId === "workspace-404") {
        throw new Error("forbidden");
      }

      return children;
    }
  ),
}));

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Workspace" })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

describe("workspace page route", () => {
  beforeEach(() => {
    (OrganizationRouteGuard as jest.Mock).mockClear();
  });

  it("redirects to the dashboard when the workspace belongs to the current user", async () => {
    const pageModule = await import("../../src/app/(protected)/(global)/[organizationId]/page");
    const element = await pageModule.default({
      params: Promise.resolve({ organizationId: "workspace-123" }),
    });

    expect(() => render(element)).toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationId: "workspace-123",
      })}`
    );

    expect(OrganizationRouteGuard).toHaveBeenCalled();
  });

  it("renders the forbidden route state when the workspace is not accessible", async () => {
    const pageModule = await import("../../src/app/(protected)/(global)/[organizationId]/page");
    const element = await pageModule.default({
      params: Promise.resolve({ organizationId: "workspace-404" }),
    });

    expect(() => render(element)).toThrow("forbidden");
  });
});

describe("workspace page loading route", () => {
  it("renders a loading spinner from loading.tsx", async () => {
    const pageModule = await import("../../src/app/(protected)/(global)/[organizationId]/loading");

    render(<pageModule.default />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
