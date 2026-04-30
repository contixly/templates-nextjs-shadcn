import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => values?.provider ?? key,
}));

jest.mock("@features/accounts/components/ui/provider-button", () => ({
  ProviderButton: ({ provider }: { provider: { name: string } }) => (
    <button type="button">{provider.name}</button>
  ),
}));

import { LoginForm } from "@features/accounts/components/forms/login-form";

describe("LoginForm", () => {
  it("renders only configured social providers", async () => {
    await act(async () => {
      render(
        <LoginForm
          getLastLoginPromise={Promise.resolve(null)}
          socialProviderIds={["google", "vk"]}
        />
      );
    });

    expect(await screen.findByRole("button", { name: "Google" })).toBeVisible();
    expect(screen.getByRole("button", { name: "VK" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "GitLab" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Yandex" })).not.toBeInTheDocument();
  });
});
