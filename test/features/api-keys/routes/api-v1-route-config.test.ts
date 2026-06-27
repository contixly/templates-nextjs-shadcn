import { routesConfig } from "@features/routes";

describe("/api/v1 route config", () => {
  it("lets API v1 route handlers own API key authentication", () => {
    expect(routesConfig.publicApiRoute).toContain("/api/v1/(.*)");
  });
});
