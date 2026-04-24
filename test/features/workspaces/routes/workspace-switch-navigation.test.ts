jest.mock("@lib/environment", () => ({
  BOT_AGENTS: /^$/,
}));

import type { Page } from "@typings/pages";
import {
  isWorkspaceSwitchPreservableRoute,
  resolveWorkspaceSwitchHref,
} from "@features/workspaces/workspace-switch-navigation";

const fakePage = (pathTemplate: string): Page =>
  ({
    pathTemplate,
    path: ({ organizationKey }: { organizationKey?: string | null } = {}) =>
      pathTemplate.replace("[organizationKey]", organizationKey ?? ""),
    featureName: "workspaces",
    pageKey: "fake",
    i18n: {
      namespace: "workspaces.pages.workspace",
    },
  }) as Page;

describe("workspace switch navigation", () => {
  it("preserves registered base workspace routes with only an organization key segment", () => {
    expect(
      resolveWorkspaceSwitchHref({
        currentPathname: "/w/acme/settings/invitations",
        workspace: { id: "workspace-2", slug: "client-workspace" },
      })
    ).toBe("/w/client-workspace/settings/invitations");
  });

  it("falls back to the selected workspace dashboard for unknown routes", () => {
    expect(
      resolveWorkspaceSwitchHref({
        currentPathname: "/w/acme/settings/invitations/invitation-1",
        workspace: { id: "workspace-2", slug: "client-workspace" },
      })
    ).toBe("/w/client-workspace/dashboard");
  });

  it("falls back when a matched route has dynamic identifiers beyond organizationKey", () => {
    expect(
      isWorkspaceSwitchPreservableRoute(
        fakePage("/w/[organizationKey]/projects/[projectId]/settings")
      )
    ).toBe(false);
  });

  it("uses the workspace id for the dashboard fallback when a workspace has no slug", () => {
    expect(
      resolveWorkspaceSwitchHref({
        currentPathname: "/w/workspace-1/not-registered",
        workspace: { id: "workspace-2", slug: null },
      })
    ).toBe("/w/workspace-2/dashboard");
  });
});
