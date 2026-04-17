import { getMenuItem } from "../../src/lib/ui";

describe("getMenuItem", () => {
  it("uses the provided label and page path", () => {
    expect(
      getMenuItem(
        {
          featureName: "accounts",
          pageKey: "profile",
          path: () => "/user/profile",
          icon: undefined,
        } as never,
        "Profile"
      )
    ).toEqual({
      label: "Profile",
      url: "/user/profile",
      icon: undefined,
    });
  });

  it("throws when the label is blank", () => {
    expect(() =>
      getMenuItem(
        {
          featureName: "accounts",
          pageKey: "profile",
          path: () => "/user/profile",
          icon: undefined,
        } as never,
        "   "
      )
    ).toThrow('Missing menu item label for "accounts.profile"');
  });
});
