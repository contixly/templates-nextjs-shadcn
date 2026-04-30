import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  loadWorkspaceSettingsPageContext,
  loadWorkspaceSettingsTeamsPageContext,
  loadWorkspaceSettingsUsersPageContext,
} from "@features/workspaces/workspaces-settings";
import { loadWorkspaceSettingsInvitationsPageContext } from "@features/workspaces/workspaces-invitations";

const never = () => new Promise(() => undefined);
const originalConsoleError = console.error;

const silenceExpectedServerComponentSuspenseWarnings = (
  ...args: Parameters<typeof console.error>
) => {
  const message = String(args[0]);

  if (
    message.includes("is an async Client Component") ||
    message.includes("A suspended resource finished loading inside a test") ||
    message.includes("A component suspended inside an `act` scope")
  ) {
    return;
  }

  originalConsoleError(...args);
};

jest.mock("@features/dashboard/ui/template/section-cards", () => ({
  SectionCards: () => <div data-testid="section-cards" />,
}));

jest.mock("@features/dashboard/ui/template/chart-area-interactive", () => ({
  ChartAreaInteractive: () => <div data-testid="chart-area-interactive" />,
}));

jest.mock("@features/dashboard/ui/template/data-table", () => ({
  DataTable: () => <div data-testid="data-table" />,
}));

jest.mock("@features/organizations/components/organization-route-guard", () => ({
  OrganizationRouteGuard: () => {
    throw never();
  },
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-page", () => ({
  WorkspaceSettingsPage: () => <div data-testid="workspace-settings-page" />,
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-users-page", () => ({
  WorkspaceSettingsUsersPage: () => <div data-testid="workspace-settings-users-page" />,
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-teams-page", () => ({
  WorkspaceSettingsTeamsPage: () => <div data-testid="workspace-settings-teams-page" />,
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-invitations-page", () => ({
  WorkspaceSettingsInvitationsPage: () => <div data-testid="workspace-settings-invitations-page" />,
}));

jest.mock("@features/workspaces/components/pages/workspace-settings-placeholder-page", () => ({
  WorkspaceSettingsPlaceholderPage: () => <div data-testid="workspace-settings-placeholder-page" />,
}));

jest.mock("@hooks/use-page-translations", () => ({
  usePageTranslations: (page: { pageKey: string }) => ({
    title: page.pageKey,
    description: `${page.pageKey} description`,
  }),
}));

jest.mock("@features/workspaces/workspaces-settings", () => ({
  loadWorkspaceSettingsPageContext: jest.fn(),
  loadWorkspaceSettingsTeamsPageContext: jest.fn(),
  loadWorkspaceSettingsUsersPageContext: jest.fn(),
}));

jest.mock("@features/workspaces/workspaces-invitations", () => ({
  loadWorkspaceSettingsInvitationsPageContext: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

jest.mock("@lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Workspace" })),
}));

describe("workspace route streaming boundaries", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(silenceExpectedServerComponentSuspenseWarnings);
    (loadWorkspaceSettingsPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsTeamsPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsUsersPageContext as jest.Mock).mockReset();
    (loadWorkspaceSettingsInvitationsPageContext as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("streams the organization dashboard behind a dashboard-shaped skeleton", async () => {
    const pageModule =
      await import("../../../../src/app/(protected)/(global)/w/[organizationKey]/dashboard/page");

    const element = pageModule.default({
      params: Promise.resolve({ organizationKey: "acme" }),
    });

    expect(React.isValidElement(element)).toBe(true);

    const { container } = render(element);

    expect(
      container.querySelector('[data-slot="organization-dashboard-page-skeleton"]')
    ).toBeInTheDocument();
  });

  it.each([
    {
      name: "workspace",
      load: loadWorkspaceSettingsPageContext,
      pageKey: "settings_workspace",
      slot: "workspace-settings-page-skeleton",
      importPage: () =>
        import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/workspace/page"),
    },
    {
      name: "users",
      load: loadWorkspaceSettingsUsersPageContext,
      pageKey: "settings_users",
      slot: "workspace-settings-users-page-skeleton",
      importPage: () =>
        import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/users/page"),
    },
    {
      name: "teams",
      load: loadWorkspaceSettingsTeamsPageContext,
      pageKey: "settings_teams",
      slot: "workspace-settings-teams-page-skeleton",
      importPage: () =>
        import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/teams/page"),
    },
    {
      name: "invitations",
      load: loadWorkspaceSettingsInvitationsPageContext,
      pageKey: "settings_invitations",
      slot: "workspace-settings-invitations-page-skeleton",
      importPage: () =>
        import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/invitations/page"),
    },
    {
      name: "roles",
      load: loadWorkspaceSettingsPageContext,
      pageKey: "settings_roles",
      slot: "workspace-settings-placeholder-page-skeleton",
      importPage: () =>
        import("../../../../src/app/(protected)/(global)/w/[organizationKey]/settings/roles/page"),
    },
  ])(
    "renders the $name settings page intro outside its async skeleton boundary",
    async ({ load, pageKey, slot, importPage }) => {
      (load as jest.Mock).mockImplementation(never);

      const pageModule = await importPage();
      const element = pageModule.default({
        params: Promise.resolve({ organizationKey: "acme" }),
      });

      expect(React.isValidElement(element)).toBe(true);

      const { container } = render(element);

      expect(screen.getByRole("heading", { level: 1, name: pageKey })).toBeInTheDocument();
      expect(container.querySelectorAll('[data-slot="settings-page-intro"]')).toHaveLength(1);
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    }
  );
});
