import { routesConfig } from "@features/routes";

describe("local automation auth route config", () => {
  it("keeps local automation auth public at the proxy layer", () => {
    expect(routesConfig.publicApiRoute).toContain("/api/local-auth/(.*)");
  });
});
