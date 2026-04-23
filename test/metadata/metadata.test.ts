import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { buildPageMetadata, resolveOpenGraphLocale } from "../../src/lib/metadata";
import { getPageTranslations } from "../../src/lib/page-translations";
import { usePageTranslations } from "../../src/hooks/use-page-translations";
import { Page } from "../../src/types/pages";

const messages = {
  title: "Sign In",
  description: "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
};

const mockGetTranslations = jest.fn();
const mockUseTranslations = jest.fn();

jest.mock("next-intl/server", () => ({
  getTranslations: (...args: unknown[]) => mockGetTranslations(...args),
}));

jest.mock("next-intl", () => ({
  useTranslations: (...args: unknown[]) => mockUseTranslations(...args),
}));

jest.mock("better-auth", () => ({
  isProduction: false,
}));

const page = {
  path: jest.fn(() => "/auth/login"),
  pathTemplate: "/auth/login",
  featureName: "accounts",
  pageKey: "login",
  i18n: {
    namespace: "accounts.pages.login",
  },
} as Page;

const translator = Object.assign(
  (key: string) => {
    const value = key in messages ? messages[key as keyof typeof messages] : undefined;

    if (value === undefined) {
      throw new Error(`Missing message: ${key}`);
    }

    return value;
  },
  {
    has: (key: string) => key in messages,
  }
);

describe("page metadata translations", () => {
  beforeEach(() => {
    mockGetTranslations.mockResolvedValue(translator);
    mockUseTranslations.mockReturnValue(translator);
    page.path.mockClear();
  });

  it("resolves page translations with optional metadata fallbacks", async () => {
    const translations = await getPageTranslations(page);

    expect(translations).toEqual({
      title: "Sign In",
      description: "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
      openGraphTitle: "Sign In",
      openGraphDescription:
        "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
    });
    expect(mockGetTranslations).toHaveBeenCalledWith("accounts.pages.login");
  });

  it("builds metadata from localized page translations", async () => {
    const metadata = await buildPageMetadata(page, { query: { ref: "email" } });

    expect(page.path).toHaveBeenCalledWith({ query: { ref: "email" } });
    expect(metadata).toMatchObject({
      title: "Sign In",
      description: "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
      openGraph: {
        type: "website",
        locale: resolveOpenGraphLocale(),
        siteName: "Application Template",
        title: "Sign In",
        description:
          "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
        url: "/auth/login",
      },
      twitter: {
        card: "summary_large_image",
        creator: "@kroniak",
        title: "Sign In",
        description:
          "Sign in with Google or GitHub. Secure OAuth authentication without passwords.",
      },
    });
  });

  it("derives the Open Graph locale from the configured app locale", async () => {
    const previousDefaultLocale = process.env.PUBLIC_DEFAULT_LOCALE;

    process.env.PUBLIC_DEFAULT_LOCALE = "ru";
    jest.resetModules();

    try {
      const metadataModule = await import("../../src/lib/metadata");

      expect(metadataModule.resolveOpenGraphLocale()).toBe("ru_RU");
      expect(metadataModule.GlobalOpenGraph.locale).toBe("ru_RU");
    } finally {
      if (previousDefaultLocale === undefined) {
        delete process.env.PUBLIC_DEFAULT_LOCALE;
      } else {
        process.env.PUBLIC_DEFAULT_LOCALE = previousDefaultLocale;
      }

      jest.resetModules();
    }
  });

  it("resolves page translations in the client hook", () => {
    const Probe = () => {
      const translations = usePageTranslations(page);

      return React.createElement(
        "pre",
        { "data-testid": "translations" },
        JSON.stringify(translations)
      );
    };

    render(React.createElement(Probe));

    expect(screen.getByTestId("translations")).toHaveTextContent("Sign In");
    expect(screen.getByTestId("translations")).toHaveTextContent(
      "Sign in with Google or GitHub. Secure OAuth authentication without passwords."
    );
    expect(mockUseTranslations).toHaveBeenCalledWith("accounts.pages.login");
  });
});
