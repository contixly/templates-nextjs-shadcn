import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsPlaceholderPage } from "@features/workspaces/components/pages/workspace-settings-placeholder-page";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      workspaces: {
        ui: {
          settingsPlaceholder: {
            badge: "Coming soon",
            body: "This section is visible now but management tools are not part of this change.",
            sections: {
              teams: {
                pageTitle: "Teams",
                pageDescription: "Review the upcoming workspace team management area.",
                title: "Team management",
                description: "Workspace team management will be added here in a follow-up change.",
              },
            },
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

describe("WorkspaceSettingsPlaceholderPage", () => {
  it("renders placeholder pages as intro plus a non-interactive section island", () => {
    const { container } = render(<WorkspaceSettingsPlaceholderPage section="teams" />);

    expect(container.firstElementChild).toHaveAttribute("data-slot", "settings-page-intro");
    expect(screen.getByRole("heading", { level: 1, name: "Teams" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Team management" })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="settings-section"]')).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
