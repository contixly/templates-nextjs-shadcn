import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React, { act } from "react";
import { loadAccessibleOrganization } from "@features/organizations/components/organization-route-guard";

const originalConsoleError = console.error;

const silenceExpectedServerComponentSuspenseWarnings = (
  ...args: Parameters<typeof console.error>
) => {
  const message = args.map(String).join(" ");

  if (
    message.includes("is an async Client Component") ||
    message.includes("A component was suspended by an uncached promise") ||
    message.includes("A component suspended inside an `act` scope")
  ) {
    return;
  }

  originalConsoleError(...args);
};

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

jest.mock("@components/application/document/document-sidebar", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="document-sidebar">{children}</div>
  ),
  DocumentSidebarSkeleton: () => <div data-testid="workspace-settings-nav-skeleton" />,
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
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(silenceExpectedServerComponentSuspenseWarnings);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
    const element = layoutModule.default({
      children: <div>workspace-page</div>,
      params: Promise.resolve({ organizationKey: "acme" }),
    });

    await act(async () => {
      render(element);
    });

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("settings-shell-children")).toHaveTextContent("workspace-page");
    });

    const navElement = await layoutModule.WorkspaceSettingsNav({
      organizationId: "org-1",
      organizationKey: "acme",
    });

    const navRender = render(navElement);

    expect(
      navRender.container.querySelector('[data-testid="nav-workspace-settings"]')
    ).toHaveTextContent("acme");
  });

  it("renders the workspace settings shell fallback while the organization lookup is still loading", async () => {
    (loadAccessibleOrganization as jest.Mock).mockImplementationOnce(
      () => new Promise(() => undefined)
    );

    const layoutModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/layout");
    const element = layoutModule.default({
      children: <div>workspace-page</div>,
      params: Promise.resolve({ organizationKey: "acme" }),
    });

    expect(React.isValidElement(element)).toBe(true);

    const { container } = render(element);

    expect(screen.getByTestId("settings-page-shell")).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="workspace-settings-nav-skeleton"]')
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings-shell-children")).toBeEmptyDOMElement();
    expect(screen.queryByText("workspace-page")).not.toBeInTheDocument();
  });

  it("renders onboarding instead of settings children when the user has no accessible workspaces", async () => {
    (loadAccessibleOrganization as jest.Mock).mockResolvedValueOnce(null);

    const ForbiddenSettingsChild = () => {
      throw new Error("settings child rendered");
    };

    const layoutModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/layout");
    const element = layoutModule.default({
      children: <ForbiddenSettingsChild />,
      params: Promise.resolve({ organizationKey: "acme" }),
    });

    render(element);

    expect(await screen.findByTestId("workspace-onboarding-guard")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-page-shell")).not.toBeInTheDocument();
  });
});
