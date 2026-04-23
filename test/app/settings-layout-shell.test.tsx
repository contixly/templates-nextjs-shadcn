import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("../../src/features/accounts/components/nav/nav-user-settings", () => ({
  NavUserSettings: () => <div data-testid="nav-user-settings">user-nav</div>,
}));

jest.mock("../../src/features/workspaces/components/nav/nav-workspace-settings", () => ({
  NavWorkspaceSettings: ({ organizationKey }: { organizationKey: string }) => (
    <div data-testid="nav-workspace-settings">{organizationKey}</div>
  ),
}));

jest.mock("../../src/features/organizations/components/organization-route-guard", () => ({
  OrganizationRouteGuard: ({
    children,
  }: {
    children: (organization: { id: string; slug: string }) => React.ReactNode;
  }) => <>{children({ id: "org-1", slug: "acme" })}</>,
}));

jest.mock("../../src/features/organizations/organizations-context", () => ({
  getOrganizationRouteKey: (organization: { slug?: string; id: string }) =>
    organization.slug ?? organization.id,
}));

jest.mock("../../src/components/application/settings/settings-shell", () => ({
  SettingsPageShell: ({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) => (
    <div data-testid="settings-page-shell">
      <div data-testid="settings-shell-nav">{nav}</div>
      <div data-testid="settings-shell-children">{children}</div>
    </div>
  ),
}));

describe("settings layouts", () => {
  it("renders the user settings layout through the shared shell", async () => {
    const layoutModule = await import("../../src/app/(protected)/(global)/user/layout");
    const element = await layoutModule.default({ children: <div>profile-page</div> });

    render(element);

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(screen.getByTestId("settings-shell-nav")).toHaveTextContent("user-nav");
    expect(screen.getByTestId("settings-shell-children")).toHaveTextContent("profile-page");
  });

  it("renders the workspace settings layout through the shared shell", async () => {
    const layoutModule =
      await import("../../src/app/(protected)/(global)/[organizationKey]/settings/layout");
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
