import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("next-intl", () => ({
  useLocale: () => "ru",
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      common: {
        words: {
          verbs: {
            cancel: "Отмена",
            create: "Создать",
          },
        },
      },
      workspaces: {
        validation: {
          errors: {
            nameRequired: "Название рабочего пространства обязательно",
            nameTooLong: "Название рабочего пространства должно содержать не более 50 символов",
            nameInvalidCharacters:
              "Название рабочего пространства может содержать только буквы, цифры, пробелы, дефисы и подчёркивания",
            duplicateName: "Рабочее пространство с таким названием уже существует",
          },
        },
        ui: {
          createDialog: {
            title: "Создать новое рабочее пространство",
            description:
              "Создайте рабочее пространство, чтобы изолировать данные или контексты вашего продукта.",
            trigger: "Создать новое рабочее пространство",
            nameLabel: "Название рабочего пространства",
            namePlaceholder: "Например: Работа, Личное, Проекты",
            nameHint: "Максимум 50 символов",
            defaultLabel: "Сделать рабочим пространством по умолчанию",
            success: "Рабочее пространство успешно создано",
            errorTitle: "Создание рабочего пространства",
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

jest.mock("../../src/components/ui/custom/modal", () => ({
  Modal: ({ children, trigger }: { children?: React.ReactNode; trigger?: React.ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}));

jest.mock("../../src/features/workspaces/actions/create-workspace", () => ({
  createWorkspace: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { WorkspaceCreateDialog } from "../../src/features/workspaces/components/forms/workspace-create-dialog";
import { createWorkspace } from "../../src/features/workspaces/actions/create-workspace";
import { toast } from "sonner";

describe("WorkspaceCreateDialog", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
  });

  beforeEach(() => {
    (toast.error as jest.Mock).mockReset();
    (createWorkspace as jest.Mock).mockReset();
  });

  it("renders localized validation errors for invalid workspace names", async () => {
    render(<WorkspaceCreateDialog />);

    const input = screen.getByLabelText("Название рабочего пространства");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);

    expect(
      await screen.findByText("Название рабочего пространства обязательно")
    ).toBeInTheDocument();
  });

  it("extends custom triggers so long labels can wrap instead of truncating", () => {
    render(
      <WorkspaceCreateDialog
        trigger={
          <button className="existing-trigger-class" type="button">
            <span>Создать новое рабочее пространство</span>
          </button>
        }
      />
    );

    const trigger = screen.getByRole("button", {
      name: "Создать новое рабочее пространство",
    });

    expect(trigger).toHaveClass("existing-trigger-class");
    expect(trigger).toHaveClass("h-auto");
    expect(trigger).toHaveClass("min-h-12");
    expect(trigger.className).toContain("[&>span:last-child]:overflow-visible");
    expect(trigger.className).toContain("[&>span:last-child]:text-clip");
    expect(trigger.className).toContain("[&>span:last-child]:whitespace-normal");
  });

  it("localizes action error keys before showing them in toast", async () => {
    (createWorkspace as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        message: "validation.errors.duplicateName",
      },
    });

    render(<WorkspaceCreateDialog />);

    const input = screen.getByLabelText("Название рабочего пространства");
    fireEvent.change(input, {
      target: { value: "Работа" },
    });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Создание рабочего пространства", {
        description: "Рабочее пространство с таким названием уже существует",
      });
    });
  });

  it("passes through non-translated action messages unchanged", async () => {
    (createWorkspace as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        message: "500",
      },
    });

    render(<WorkspaceCreateDialog />);

    const input = screen.getByLabelText("Название рабочего пространства");
    fireEvent.change(input, {
      target: { value: "Работа" },
    });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Создание рабочего пространства", {
        description: "500",
      });
    });
  });
});
