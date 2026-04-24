import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React from "react";
import { UserDangerousZone } from "@features/accounts/components/user-dangerous-zone";
import { UserProfile } from "@features/accounts/components/user-profile";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      common: {
        words: {
          verbs: {
            delete: "Delete",
          },
        },
      },
      accounts: {
        pages: {
          profile: {
            title: "Profile Settings",
            description: "Review your identity, contact details, and account metadata.",
          },
          danger: {
            title: "Danger Zone",
            description: "Review irreversible account operations before taking action.",
          },
        },
        ui: {
          deleteDialog: {
            title: "Delete Account?",
            description: "This action cannot be undone.",
          },
          danger: {
            title: "Delete account",
            description: "Permanently remove your account and all associated data.",
          },
          profile: {
            avatarTitle: "Avatar",
            avatarDescription: "Your avatar is synced from your connected social account.",
            avatarHintPrimary: "Avatar images are provided by your connected accounts.",
            avatarHintSecondary: "To change your avatar, update it on Google or GitHub.",
            displayNameTitle: "Display Name",
            displayNameDescription:
              "This is the name that will be displayed across the application.",
            emailTitle: "Email Address",
            emailDescription: "Your email address is used for notifications and account recovery.",
            emailHint: "Email cannot be changed. It is linked to your social account.",
            userIdTitle: "User ID",
            userIdDescription: "Your unique identifier in our system.",
            memberSinceTitle: "Member Since",
            memberSinceDescription: "The date you created your account.",
          },
        },
      },
    };

    const path = [namespace, key].filter(Boolean).join(".");
    const value = path.split(".").reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === "object" && segment in acc) {
        return (acc as Record<string, unknown>)[segment];
      }

      return path;
    }, messages);

    return typeof value === "string" ? value : path;
  },
}));

jest.mock("@features/accounts/components/forms/profile-form", () => ({
  ProfileForm: () => <div data-testid="profile-form" />,
}));

jest.mock("@features/accounts/components/forms/account-delete-dialog", () => ({
  AccountDeleteDialog: ({ email }: { email: string }) => (
    <div data-testid="account-delete-dialog">{email}</div>
  ),
}));

jest.mock("@components/ui/custom/copy-button", () => ({
  CopyButton: ({ text }: { text: string }) => <button type="button">Copy {text}</button>,
}));

jest.mock("@lib/time", () => ({
  timeTools: {
    formatDate: (date: Date | string) => `formatted:${new Date(date).toISOString()}`,
  },
}));

const user = {
  id: "user_123",
  name: "Kroniak",
  email: "kroniak@example.com",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-04-17T00:00:00.000Z"),
  updatedAt: new Date("2026-04-17T00:00:00.000Z"),
};

describe("account settings surfaces", () => {
  it("renders profile context first and separates each profile decision into islands", async () => {
    let container!: HTMLElement;

    await act(async () => {
      container = render(<UserProfile loadCurrentUserPromise={Promise.resolve(user)} />).container;
    });

    expect(container.firstElementChild).toHaveAttribute("data-slot", "settings-page-intro");
    expect(screen.getByRole("heading", { level: 1, name: "Profile Settings" })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(5);
    expect(screen.getByRole("heading", { level: 2, name: "Avatar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Display Name" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Email Address" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "User ID" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Member Since" })).toBeInTheDocument();
  });

  it("renders the danger page as a destructive section island after the intro", async () => {
    let container!: HTMLElement;

    await act(async () => {
      container = render(
        <UserDangerousZone loadCurrentUserPromise={Promise.resolve(user)} />
      ).container;
    });

    expect(container.firstElementChild).toHaveAttribute("data-slot", "settings-page-intro");
    expect(screen.getByRole("heading", { level: 1, name: "Danger Zone" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Delete account" })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="settings-section"]')).toHaveAttribute(
      "data-variant",
      "destructive"
    );
    expect(screen.getByTestId("account-delete-dialog")).toHaveTextContent("kroniak@example.com");
  });
});
