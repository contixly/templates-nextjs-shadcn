import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { WorkspaceSettingsForm } from "@features/workspaces/components/forms/workspace-settings-form";
import { updateWorkspace } from "@features/workspaces/actions/update-workspace";

const WORKSPACE_ID = "d6qzollaqro6y66v7j52bhqo";
const mockRefresh = jest.fn();

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
            duplicateName: "Рабочее пространство с таким названием уже существует",
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
            defaultLabel: "Сделать рабочим пространством по умолчанию",
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

jest.mock("../../src/features/workspaces/actions/update-workspace", () => ({
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

  it("loads the current workspace name and slug into the extracted page form", () => {
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
          isDefault: true,
        }}
        canChangeDefault
      />
    );

    expect(screen.getByDisplayValue("Client Workspace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("client-workspace")).toBeInTheDocument();
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
        isDefault: false,
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
          isDefault: false,
        }}
      />
    );

    fireEvent.change(screen.getByLabelText("Название рабочего пространства"), {
      target: { value: "Renamed Workspace" },
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
});
