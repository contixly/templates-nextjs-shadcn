import { buildFeature } from "../../src/lib/pages";

describe("buildFeature", () => {
  it("assigns page keys, i18n namespaces, and resolved parent pages", () => {
    const feature = buildFeature("accounts", {
      pages: {
        user: {
          pathTemplate: "/user",
        },
        profile: {
          parent: "user",
          pathTemplate: "/user/profile",
          hidePageHeader: true,
        },
      },
    });

    expect(feature.pages.user.pageKey).toBe("user");
    expect(feature.pages.user.i18n.namespace).toBe("accounts.pages.user");
    expect(feature.pages.profile.pageKey).toBe("profile");
    expect(feature.pages.profile.i18n.namespace).toBe("accounts.pages.profile");
    expect(feature.pages.profile.parent).toBe(feature.pages.user);
    expect(feature.pages.profile.path()).toBe("/user/profile");
  });

  it("throws when parent references an unknown page key", () => {
    expect(() =>
      buildFeature("accounts", {
        pages: {
          profile: {
            parent: "missing",
            pathTemplate: "/user/profile",
          },
        },
      })
    ).toThrow('Unknown parent page "missing" for "accounts.profile"');
  });
});
