import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import type { Account } from "better-auth";
import React from "react";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

jest.mock("@lib/auth-client", () => ({
  authClient: {
    linkSocial: jest.fn(),
    oauth2: {
      link: jest.fn(),
    },
    unlinkAccount: jest.fn(),
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { UserConnections } from "@features/accounts/components/user-connections";

const createAccount = (providerId: string): Account => ({
  id: `account_${providerId}`,
  accountId: `provider_account_${providerId}`,
  providerId,
  userId: "user_1",
  createdAt: new Date("2026-04-17T00:00:00.000Z"),
  updatedAt: new Date("2026-04-17T00:00:00.000Z"),
});

describe("UserConnections", () => {
  beforeEach(() => {
    refresh.mockReset();
  });

  it("keeps the last configured linked provider from being unlinked", async () => {
    await act(async () => {
      render(
        <UserConnections
          loadCurrentUserAccountsPromise={Promise.resolve([
            createAccount("google"),
            createAccount("github"),
          ])}
          getLastLoginPromise={Promise.resolve(null)}
          socialProviderIds={["google"]}
        />
      );
    });

    expect(await screen.findByText("Google")).toBeVisible();
    expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "disconnect" })).toBeDisabled();
  });

  it("allows unlinking when another configured linked provider remains", async () => {
    await act(async () => {
      render(
        <UserConnections
          loadCurrentUserAccountsPromise={Promise.resolve([
            createAccount("google"),
            createAccount("github"),
          ])}
          getLastLoginPromise={Promise.resolve(null)}
          socialProviderIds={["google", "github"]}
        />
      );
    });

    expect(await screen.findByText("Google")).toBeVisible();
    expect(screen.getByText("GitHub")).toBeVisible();
    screen
      .getAllByRole("button", { name: "disconnect" })
      .forEach((button) => expect(button).not.toBeDisabled());
  });
});
