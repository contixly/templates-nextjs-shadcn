jest.mock("../../src/lib/environment", () => ({
  BOT_AGENTS: /^$/,
}));

import routes from "../../src/features/routes";
import { findRouteByPath } from "../../src/lib/routes";

describe("workspace settings route resolution", () => {
  it("matches the dedicated workspace settings section routes", () => {
    expect(findRouteByPath("/acme/settings/workspace")).toBe(
      routes.workspaces.pages.settings_workspace
    );
    expect(findRouteByPath("/acme/settings/users")).toBe(routes.workspaces.pages.settings_users);
    expect(findRouteByPath("/acme/settings/roles")).toBe(routes.workspaces.pages.settings_roles);
  });
});
