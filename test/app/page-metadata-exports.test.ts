import { buildPageMetadata } from "../../src/lib/metadata";
import accountsRoutes from "../../src/features/accounts/accounts-routes";
import workspaceRoutes from "../../src/features/workspaces/workspaces-routes";

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Sign In" })),
  GlobalMetadata: { applicationName: "Application Template" },
}));

jest.mock("../../src/lib/metadata-og", () => ({
  buildMetadataOGImage: jest.fn(async () => "og-image"),
}));

jest.mock("../../src/features/accounts/components/forms/login-form", () => ({
  LoginForm: () => null,
}));

jest.mock("../../src/lib/cookies", () => ({
  getFromCookie: jest.fn(),
}));

jest.mock("../../src/lib/environment", () => ({
  LAST_LOGIN_METHOD_KEY: "last-login-method",
}));

describe("login page metadata export", () => {
  it("delegates to buildPageMetadata through generateMetadata", async () => {
    const module = await import("../../src/app/(public)/(simple)/auth/login/page");
    const mockedBuildPageMetadata = buildPageMetadata as jest.MockedFunction<
      typeof buildPageMetadata
    >;

    expect(await module.generateMetadata()).toEqual({ title: "Sign In" });
    expect(mockedBuildPageMetadata).toHaveBeenCalledWith(accountsRoutes.pages.login);
  });
});

describe("workspace og image export", () => {
  it("forwards workspace params to buildPageMetadata", async () => {
    const module = await import("../../src/app/(protected)/(global)/[workspaceId]/opengraph-image");
    const mockedBuildPageMetadata = buildPageMetadata as jest.MockedFunction<
      typeof buildPageMetadata
    >;

    await module.default({ params: Promise.resolve({ workspaceId: "workspace-123" }) });

    expect(mockedBuildPageMetadata).toHaveBeenCalledWith(workspaceRoutes.pages.workspace, {
      workspaceId: "workspace-123",
    });
  });
});
