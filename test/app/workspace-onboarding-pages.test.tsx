import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { loadCurrentUser, loadCurrentUserId } from "@features/accounts/accounts-actions";
import { countAccessibleOrganizationsByUserId } from "@features/organizations/organizations-repository";
import { loadUserWorkspaces } from "@features/workspaces/actions/load-user-workspaces";

jest.mock("../../src/features/accounts/accounts-actions", () => ({
  loadCurrentUserId: jest.fn(),
  loadCurrentUser: jest.fn(),
}));

jest.mock("../../src/features/organizations/organizations-repository", () => ({
  countAccessibleOrganizationsByUserId: jest.fn(),
}));

jest.mock("../../src/features/workspaces/actions/load-user-workspaces", () => ({
  loadUserWorkspaces: jest.fn(),
}));

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Page" })),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

jest.mock("../../src/components/ui/badge", () => ({
  Badge: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../src/components/ui/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("../../src/components/ui/separator", () => ({
  Separator: () => <hr />,
}));

jest.mock("../../src/features/application/components/home-cta-section", () => ({
  HomeCTASection: () => <div data-testid="home-cta-section" />,
}));

jest.mock("../../src/features/application/template-landing-content", () => ({
  templateStackFeatureBlocks: [],
}));

jest.mock("../../src/features/workspaces/components/ui/workspace-onboarding-guard", () => ({
  WorkspaceOnboardingGuard: () => <div data-testid="workspace-onboarding-guard" />,
}));

jest.mock("../../src/features/workspaces/components/user-workspaces", () => ({
  UserWorkspaces: ({
    loadUserWorkspacesPromise,
  }: {
    loadUserWorkspacesPromise: Promise<unknown>;
  }) => (
    <div
      data-testid="user-workspaces"
      data-has-promise={String(Boolean(loadUserWorkspacesPromise))}
    />
  ),
}));

jest.mock("../../src/features/accounts/components/user-profile", () => ({
  UserProfile: ({ loadCurrentUserPromise }: { loadCurrentUserPromise: Promise<unknown> }) => (
    <div data-testid="user-profile" data-has-promise={String(Boolean(loadCurrentUserPromise))} />
  ),
}));

describe("workspace onboarding pages", () => {
  beforeEach(() => {
    (loadCurrentUserId as jest.Mock).mockReset();
    (loadCurrentUser as jest.Mock).mockReset();
    (countAccessibleOrganizationsByUserId as jest.Mock).mockReset();
    (loadUserWorkspaces as jest.Mock).mockReset();
  });

  it("renders the onboarding guard on the welcome page for authenticated users with zero accessible workspaces", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (countAccessibleOrganizationsByUserId as jest.Mock).mockResolvedValue(0);

    const pageModule = await import("../../src/app/(protected)/(global)/welcome/page");
    const element = await pageModule.default({
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByTestId("workspace-onboarding-guard")).toBeInTheDocument();
  });

  it("keeps the workspace management page accessible for users with zero workspaces", async () => {
    (loadUserWorkspaces as jest.Mock).mockReturnValue(Promise.resolve({ success: true, data: [] }));

    const pageModule = await import("../../src/app/(protected)/(global)/workspaces/page");
    const element = await pageModule.default();

    render(element);

    expect(screen.getByTestId("user-workspaces")).toHaveAttribute("data-has-promise", "true");
  });

  it("keeps account pages accessible for users with zero workspaces", async () => {
    (loadCurrentUser as jest.Mock).mockReturnValue(Promise.resolve(undefined));

    const pageModule = await import("../../src/app/(protected)/(global)/user/profile/page");
    const element = await pageModule.default();

    render(element);

    expect(screen.getByTestId("user-profile")).toHaveAttribute("data-has-promise", "true");
  });
});
