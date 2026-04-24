jest.mock("@lib/environment", () => ({
  BOT_AGENTS: /^$/,
}));

import routes from "@features/routes";
import { findRouteByPath } from "@lib/routes";

describe("workspace settings route resolution", () => {
  it("matches the dedicated workspace settings section routes", () => {
    expect(findRouteByPath("/w/acme/settings/workspace")).toBe(
      routes.workspaces.pages.settings_workspace
    );
    expect(findRouteByPath("/w/acme/settings/users")).toBe(routes.workspaces.pages.settings_users);
    expect(findRouteByPath("/w/acme/settings/roles")).toBe(routes.workspaces.pages.settings_roles);
  });

  it("does not match unprefixed workspace settings routes", () => {
    expect(findRouteByPath("/acme/settings/users")).toBeNull();
  });
});
