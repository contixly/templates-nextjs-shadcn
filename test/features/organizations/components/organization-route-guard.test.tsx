import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { OrganizationRouteGuard } from "@features/organizations/components/organization-route-guard";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { findManyAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";

jest.mock("@features/accounts/accounts-actions", () => ({
  loadCurrentUserId: jest.fn(),
}));

jest.mock("@features/organizations/organizations-repository", () => ({
  findManyAccessibleOrganizationsByUserId: jest.fn(),
}));

jest.mock("@features/workspaces/components/ui/workspace-onboarding-guard", () => ({
  WorkspaceOnboardingGuard: () => <div data-testid="workspace-onboarding-guard" />,
}));

jest.mock("next/navigation", () => ({
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

describe("OrganizationRouteGuard", () => {
  beforeEach(() => {
    (loadCurrentUserId as jest.Mock).mockReset();
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockReset();
  });

  it("renders the onboarding guard instead of organization content when the user has no accessible workspaces", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([]);

    const result = await OrganizationRouteGuard({
      organizationKey: "org-1",
      children: <div data-testid="organization-content">Organization content</div>,
    });

    render(result);

    expect(screen.getByTestId("workspace-onboarding-guard")).toBeInTheDocument();
    expect(screen.queryByTestId("organization-content")).not.toBeInTheDocument();
  });

  it("resolves an accessible organization from a slug route key", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (findManyAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue([
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

    const result = await OrganizationRouteGuard({
      organizationKey: "acme",
      children: (organization) => <div data-testid="organization-content">{organization.name}</div>,
    });

    render(result);

    expect(screen.getByTestId("organization-content")).toHaveTextContent("Acme");
  });
});
