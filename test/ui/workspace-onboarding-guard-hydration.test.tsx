import "@testing-library/jest-dom";
import React from "react";
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { WorkspaceOnboardingGuard } from "@features/workspaces/components/ui/workspace-onboarding-guard";

const messages = {
  common: {
    words: {
      verbs: {
        cancel: "Cancel",
        create: "Create",
      },
    },
  },
  workspaces: {
    ui: {
      onboarding: {
        title: "Create your first workspace",
        description: "Set up a workspace or wait for an invitation.",
        createAction: "Create workspace",
        inviteAction: "Join with invite",
        inviteHint: "Invites are coming soon.",
      },
      createDialog: {
        title: "Create new workspace",
        description: "Create a workspace to continue.",
        trigger: "Create workspace",
        nameLabel: "Workspace name",
        namePlaceholder: "Acme",
        nameHint: "Maximum 50 characters",
        defaultLabel: "Set as default",
        success: "Workspace created",
        errorTitle: "Create workspace",
        unknownError: "Unknown error",
      },
    },
    validation: {
      errors: {
        nameRequired: "Name is required",
        nameTooLong: "Name is too long",
        nameInvalidCharacters: "Name contains invalid characters",
        duplicateName: "Workspace already exists",
      },
    },
  },
} as const;

const resolveMessage = (namespace: string, key: string) => {
  const path = [namespace, key].filter(Boolean).join(".");
  const value = path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }

    return path;
  }, messages);

  return typeof value === "string" ? value : path;
};

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => resolveMessage(namespace, key),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("../../src/features/workspaces/actions/create-workspace", () => ({
  createWorkspace: jest.fn(),
}));

describe("WorkspaceOnboardingGuard hydration", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("keeps the create-workspace trigger stable across server render and hydration", async () => {
    const element = <WorkspaceOnboardingGuard />;
    const html = renderToString(element);

    expect(html).toContain("Create workspace");
    expect(html).not.toContain("aria-haspopup");
    expect(html).not.toContain("aria-controls");
    expect(html).not.toContain('data-state="closed"');

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = html;

    await act(async () => {
      hydrateRoot(container, element);
    });

    expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining("hydration"));

    consoleErrorSpy.mockRestore();
  });
});
