import { buildDocumentsSystemMetadata } from "../../../src/features/documents-system/documents-system-metadata";

jest.mock("better-auth", () => ({
  isProduction: false,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: jest.fn(),
}));

describe("documents system metadata", () => {
  it.each([
    {
      currentPath: "index",
      expectedUrl: "/docs",
      expectedImageUrl: "/docs/og/index?locale=en",
    },
    {
      currentPath: "account/profile-connections",
      expectedUrl: "/docs/account/profile-connections",
      expectedImageUrl: "/docs/og/account/profile-connections?locale=en",
    },
  ])(
    "builds complete social metadata for $currentPath",
    ({ currentPath, expectedUrl, expectedImageUrl }) => {
      expect(
        buildDocumentsSystemMetadata({
          title: "Profile and connections",
          description: "Manage linked sign-in methods.",
          currentPath,
          locale: "en",
        })
      ).toEqual({
        title: "Profile and connections",
        description: "Manage linked sign-in methods.",
        openGraph: {
          type: "website",
          locale: "en_US",
          siteName: "Application Template",
          url: expectedUrl,
          title: "Profile and connections",
          description: "Manage linked sign-in methods.",
          images: [
            {
              url: expectedImageUrl,
              width: 1200,
              height: 630,
              type: "image/png",
              alt: "Profile and connections",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          creator: "@kroniak",
          title: "Profile and connections",
          description: "Manage linked sign-in methods.",
          images: [
            {
              url: expectedImageUrl,
              width: 1200,
              height: 630,
              type: "image/png",
              alt: "Profile and connections",
            },
          ],
        },
      });
    }
  );
});
