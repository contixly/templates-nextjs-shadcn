import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import fs from "node:fs";
import path from "node:path";
import routes from "@features/routes";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";

jest.mock("@features/organizations/components/organization-route-guard", () => ({
  OrganizationRouteGuard: jest.fn(
    ({
      organizationKey,
      children,
    }: {
      organizationKey: string;
      children:
        | React.ReactNode
        | ((organization: { id: string; slug?: string | null }) => React.ReactNode);
    }) => {
      if (organizationKey === "workspace-404") {
        throw new Error("forbidden");
      }

      if (typeof children === "function") {
        return children({
          id: "workspace-123",
          slug: "client-workspace",
        });
      }

      return children;
    }
  ),
}));

jest.mock("@lib/metadata", () => ({
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

  it("redirects slug-based links to the dashboard when the workspace belongs to the current user", async () => {
    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/page");
    const element = await pageModule.WorkspacePageRedirectContent({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    expect(() => render(element)).toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationKey: "client-workspace",
      })}`
    );

    expect(OrganizationRouteGuard).toHaveBeenCalled();
  });

  it("redirects existing id-based links to the slug-preferred dashboard url", async () => {
    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/page");
    const element = await pageModule.WorkspacePageRedirectContent({
      params: Promise.resolve({ organizationKey: "workspace-123" }),
    });

    expect(() => render(element)).toThrow(
      `redirect:${routes.dashboard.pages.organization_dashboard.path({
        organizationKey: "client-workspace",
      })}`
    );
  });

  it("renders the forbidden route state when the workspace is not accessible", async () => {
    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/page");
    const element = await pageModule.WorkspacePageRedirectContent({
      params: Promise.resolve({ organizationKey: "workspace-404" }),
    });

    expect(() => render(element)).toThrow("forbidden");
  });

  it("returns a local Suspense shell immediately for redirect handling", async () => {
    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/page");

    const element = pageModule.default({
      params: Promise.resolve({ organizationKey: "client-workspace" }),
    });

    expect(React.isValidElement(element)).toBe(true);
  });
});

describe("workspace page loading route", () => {
  it("does not define a full-route loading fallback for workspace pages", () => {
    const loadingPath = path.join(
      process.cwd(),
      "src/app/(protected)/(global)/w/[organizationKey]/loading.tsx"
    );

    expect(fs.existsSync(loadingPath)).toBe(false);
  });

  it("keeps the redirect-only route behind a local empty Suspense fallback", () => {
    const pageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(protected)/(global)/w/[organizationKey]/page.tsx"),
      "utf8"
    );

    expect(pageSource).toContain("Suspense");
    expect(pageSource).toContain("fallback={null}");
    expect(pageSource).not.toContain("Spinner");
  });
});
