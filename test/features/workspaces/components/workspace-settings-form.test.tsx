import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsForm } from "@features/workspaces/components/forms/workspace-settings-form";
import { updateWorkspace } from "@features/workspaces/actions/update-workspace";
import { toast } from "sonner";

const WORKSPACE_ID = "d6qzollaqro6y66v7j52bhqo";
const mockRefresh = jest.fn();

const settleFormValidation = async () => {
  await act(async () => {});
};

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      common: {
        words: {
          verbs: {
            cancel: "Отмена",
            save: "Сохранить",
          },
        },
      },
      workspaces: {
        validation: {
          errors: {
            nameRequired: "Введите название рабочего пространства",
            nameUnchanged: "Введите новое название рабочего пространства",
            duplicateName: "Введите другое название рабочего пространства; это уже занято",
          },
        },
        ui: {
          settingsForm: {
            nameLabel: "Название рабочего пространства",
            namePlaceholder: "Например: Работа",
            nameHint: "Максимум 50 символов",
            slugLabel: "Slug рабочего пространства",
            slugPlaceholder: "Например: rabota",
            slugHint: "Только строчные буквы, цифры и дефисы",
            allowedEmailDomainsLabel: "Разрешенные email-домены",
            allowedEmailDomainsPlaceholder: "example.com",
            allowedEmailDomainsHint: "Один точный домен на строку.",
            success: "Рабочее пространство успешно обновлено",
            errorTitle: "Обновление рабочего пространства",
            unknownError: "Неизвестная ошибка",
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

jest.mock("@features/workspaces/actions/update-workspace", () => ({
  updateWorkspace: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("WorkspaceSettingsForm", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
  });

  beforeEach(() => {
    (updateWorkspace as jest.Mock).mockReset();
    mockRefresh.mockReset();
  });

  it("loads the current workspace name, slug, and allowed domains into the extracted page form", async () => {
    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: {
            allowedEmailDomains: ["example.com", "admin.example.com"],
          },
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    await settleFormValidation();

    expect(screen.getByDisplayValue("Client Workspace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("client-workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Разрешенные email-домены")).toHaveValue(
      "example.com\nadmin.example.com"
    );
  });

  it("keeps domain separators while editing the allowed domains field", async () => {
    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    const allowedDomainsField = screen.getByLabelText("Разрешенные email-домены");

    await act(async () => {
      fireEvent.change(allowedDomainsField, {
        target: { value: "example.com\n" },
      });
    });

    expect(allowedDomainsField).toHaveValue("example.com\n");

    await act(async () => {
      fireEvent.change(allowedDomainsField, {
        target: { value: "example.com," },
      });
    });

    expect(allowedDomainsField).toHaveValue("example.com,");
  });

  it("uses one compact supporting message row for each editable field", async () => {
    const { container } = render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    await waitFor(() => {
      expect(container.querySelectorAll('[data-slot="field-message"]')).toHaveLength(3);
    });
    expect(container.querySelectorAll('[data-slot="field-description"]')).toHaveLength(0);
    expect(screen.getByLabelText("Название рабочего пространства")).toHaveAccessibleDescription(
      "Максимум 50 символов"
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows field validation during editing and replaces the hint in the same message row", async () => {
    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    const nameField = screen.getByLabelText("Название рабочего пространства");

    expect(nameField).toHaveAccessibleDescription("Максимум 50 символов");

    await act(async () => {
      fireEvent.change(nameField, {
        target: { value: "" },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Введите название рабочего пространства")).toBeInTheDocument();
    });
    expect(nameField).toHaveAccessibleDescription("Введите название рабочего пространства");
  });

  it("renders server action errors inline instead of sending them to a toast", async () => {
    (updateWorkspace as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        message: "validation.errors.duplicateName",
      },
    });

    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Название рабочего пространства"), {
        target: { value: "Existing Workspace" },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Сохранить" })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Сохранить" }).closest("form")!);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Введите другое название рабочего пространства; это уже занято")
      ).toBeVisible();
    });
    expect(screen.getByText("Обновление рабочего пространства")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("refreshes the route and resets to the saved values after a successful update", async () => {
    (updateWorkspace as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: WORKSPACE_ID,
        name: "Renamed Workspace",
        slug: "renamed-workspace",
        logo: null,
        metadata: null,
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-21T10:00:00.000Z"),
      },
    });

    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Название рабочего пространства"), {
        target: { value: "Renamed Workspace" },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Сохранить" })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Сохранить" }).closest("form")!);
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(screen.getByDisplayValue("Renamed Workspace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("renamed-workspace")).toBeInTheDocument();
  });

  it("submits edited allowed domains as a normalized list", async () => {
    (updateWorkspace as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: WORKSPACE_ID,
        name: "Client Workspace",
        slug: "client-workspace",
        logo: null,
        metadata: {
          allowedEmailDomains: ["example.com", "admin.example.com"],
        },
        createdAt: new Date("2026-04-20T10:00:00.000Z"),
        updatedAt: new Date("2026-04-21T10:00:00.000Z"),
      },
    });

    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Разрешенные email-домены"), {
        target: { value: "Example.COM\nadmin.example.com" },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Сохранить" })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.submit(screen.getByRole("button", { name: "Сохранить" }).closest("form")!);
    });

    await waitFor(() => {
      expect(updateWorkspace).toHaveBeenCalledWith({
        id: WORKSPACE_ID,
        name: "Client Workspace",
        slug: "client-workspace",
        allowedEmailDomains: ["example.com", "admin.example.com"],
      });
    });
  });

  it("enables save when a workspace with a better-auth style id is edited", async () => {
    render(
      <WorkspaceSettingsForm
        workspace={{
          id: "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H",
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
      />
    );

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Название рабочего пространства"), {
        target: { value: "Client Workspace Updated" },
      });
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Сохранить" })).not.toBeDisabled();
    });
  });

  it("renders the form in read-only mode when workspace updates are not allowed", async () => {
    render(
      <WorkspaceSettingsForm
        workspace={{
          id: WORKSPACE_ID,
          name: "Client Workspace",
          slug: "client-workspace",
          logo: null,
          metadata: null,
          createdAt: new Date("2026-04-20T10:00:00.000Z"),
          updatedAt: new Date("2026-04-20T10:00:00.000Z"),
        }}
        canUpdateWorkspace={false}
      />
    );

    await settleFormValidation();

    expect(screen.getByLabelText("Название рабочего пространства")).toBeDisabled();
    expect(screen.getByLabelText("Slug рабочего пространства")).toBeDisabled();
    expect(screen.getByLabelText("Разрешенные email-домены")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Сохранить" })).not.toBeInTheDocument();
  });
});
