import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import fs from "fs";
import path from "path";
import React from "react";

const isLocalAutomationAuthEnabledMock = jest.fn();

jest.mock("@features/accounts/accounts-local-auth", () => ({
  isLocalAutomationAuthEnabled: () => isLocalAutomationAuthEnabledMock(),
}));

jest.mock("@features/accounts/components/forms/login-form", () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

jest.mock("@features/accounts/components/forms/local-automation-login-panel", () => ({
  LocalAutomationLoginPanel: () => <div data-testid="local-automation-login-panel" />,
}));

jest.mock("@lib/cookies", () => ({
  getFromCookie: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("@lib/environment", () => ({
  LAST_LOGIN_METHOD_KEY: "last-login-method",
}));

jest.mock("@lib/metadata", () => ({
  SITE_NAME: "Contixly",
  buildPageMetadata: jest.fn(async () => ({ title: "Login" })),
}));

jest.mock("@components/ui/custom/animated-link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt }: { alt?: string }) => <span data-testid="site-logo">{alt}</span>,
}));

import LoginPage from "../../../../src/app/(public)/(simple)/auth/login/page";

describe("local automation login page", () => {
  beforeEach(() => {
    isLocalAutomationAuthEnabledMock.mockReset();
  });

  it("renders the local automation panel when local automation auth is enabled", () => {
    isLocalAutomationAuthEnabledMock.mockReturnValue(true);

    render(<LoginPage />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("local-automation-login-panel")).toBeInTheDocument();
  });

  it("omits the local automation panel when local automation auth is disabled", () => {
    isLocalAutomationAuthEnabledMock.mockReturnValue(false);

    render(<LoginPage />);

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.queryByTestId("local-automation-login-panel")).not.toBeInTheDocument();
  });

  it("wraps the local automation panel in Suspense for prerender-safe search params", () => {
    const pageSource = fs.readFileSync(
      path.join(process.cwd(), "src/app/(public)/(simple)/auth/login/page.tsx"),
      "utf8"
    );

    expect(pageSource).toContain('import { Suspense } from "react";');
    expect(pageSource).toMatch(
      /<Suspense fallback=\{null\}>\s*<LocalAutomationLoginPanel \/>\s*<\/Suspense>/s
    );
  });
});
