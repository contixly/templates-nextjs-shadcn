import workspaceRoutes from "../../src/features/workspaces/workspaces-routes";
import { loadWorkspaceSettingsPageContext } from "../../src/features/workspaces/workspaces-settings";

jest.mock("../../src/features/workspaces/workspaces-settings", () => ({
  loadWorkspaceSettingsPageContext: jest.fn(),
}));

jest.mock(
  "../../src/features/workspaces/components/pages/workspace-settings-placeholder-page",
  () => ({
    WorkspaceSettingsPlaceholderPage: () => null,
  })
);

jest.mock("../../src/features/workspaces/components/pages/workspace-settings-page", () => ({
  WorkspaceSettingsPage: () => null,
}));

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Workspace Settings" })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

describe("workspace settings root route", () => {
  beforeEach(() => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockReset();
  });

  it("redirects the settings root to the canonical workspace settings section", async () => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canChangeDefault: true,
      canonicalOrganizationKey: "client-workspace",
    });

    const pageModule =
      await import("../../src/app/(protected)/(global)/[organizationKey]/settings/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ organizationKey: "workspace-123" }),
      })
    ).rejects.toThrow(
      `redirect:${workspaceRoutes.pages.settings_workspace.path({
        organizationKey: "client-workspace",
      })}`
    );
  });
});

describe("workspace settings section routes", () => {
  beforeEach(() => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockReset();
  });

  it("redirects id-based section urls to the slug-preferred users settings path", async () => {
    (loadWorkspaceSettingsPageContext as jest.Mock).mockResolvedValue({
      workspace: { id: "workspace-123", slug: "client-workspace" },
      canChangeDefault: true,
      canonicalOrganizationKey: "client-workspace",
    });

    const pageModule =
      await import("../../src/app/(protected)/(global)/[organizationKey]/settings/users/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ organizationKey: "workspace-123" }),
      })
    ).rejects.toThrow(
      `redirect:${workspaceRoutes.pages.settings_users.path({
        organizationKey: "client-workspace",
      })}`
    );
  });
});
