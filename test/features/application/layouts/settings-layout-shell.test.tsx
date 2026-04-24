import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@features/accounts/components/nav/nav-user-settings", () => ({
  NavUserSettings: () => <div data-testid="nav-user-settings">user-nav</div>,
}));

jest.mock("@features/workspaces/components/nav/nav-workspace-settings", () => ({
  NavWorkspaceSettings: ({ organizationKey }: { organizationKey: string }) => (
    <div data-testid="nav-workspace-settings">{organizationKey}</div>
  ),
}));

jest.mock("@features/workspaces/workspaces-permissions", () => ({
  hasWorkspacePermission: jest.fn(async () => true),
}));

jest.mock("@features/organizations/components/organization-route-guard", () => ({
  loadAccessibleOrganization: jest.fn(async () => ({ id: "org-1", slug: "acme" })),
}));

jest.mock("@features/organizations/organizations-context", () => ({
  getOrganizationRouteKey: (organization: { slug?: string; id: string }) =>
    organization.slug ?? organization.id,
}));

jest.mock("@features/workspaces/components/ui/workspace-onboarding-guard", () => ({
  WorkspaceOnboardingGuard: () => <div data-testid="workspace-onboarding-guard" />,
}));

jest.mock("@components/application/settings/settings-shell", () => ({
  SettingsPageShell: ({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) => (
    <div data-testid="settings-page-shell">
      <div data-testid="settings-shell-nav">{nav}</div>
      <div data-testid="settings-shell-children">{children}</div>
    </div>
  ),
}));

describe("settings layouts", () => {
  it("renders the user settings layout through the shared shell", async () => {
    const layoutModule = await import("../../../../src/app/(protected)/(global)/user/layout");
    const element = await layoutModule.default({ children: <div>profile-page</div> });

    render(element);

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-shell-nav")).toHaveTextContent("user-nav");
    expect(screen.getByTestId("settings-shell-children")).toHaveTextContent("profile-page");
  });

  it("renders the workspace settings layout through the shared shell", async () => {
    const layoutModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/layout");
    const element = await layoutModule.default({
      children: <div>workspace-page</div>,
      params: Promise.resolve({ organizationKey: "acme" }),
    });

    render(element);

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-shell-nav")).toHaveTextContent("acme");
    expect(screen.getByTestId("settings-shell-children")).toHaveTextContent("workspace-page");
  });
});
