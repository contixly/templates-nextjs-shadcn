import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { WorkspaceCreateDialog } from "@features/workspaces/components/forms/workspace-create-dialog";
import { createWorkspace } from "@features/workspaces/actions/create-workspace";
import { toast } from "sonner";

const mockPush = jest.fn();
const mockRefresh = jest.fn();

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
            nameRequired: "Введите название рабочего пространства",
            nameTooLong: "Используйте не более 50 символов в названии рабочего пространства",
            nameInvalidCharacters:
              "Используйте только буквы, цифры, пробелы, дефисы и подчёркивания",
            duplicateName: "Введите другое название рабочего пространства; это уже занято",
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

jest.mock("@components/ui/custom/modal", () => ({
  Modal: ({ children, trigger }: { children?: React.ReactNode; trigger?: React.ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}));

jest.mock("@features/workspaces/actions/create-workspace", () => ({
  createWorkspace: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

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
    (toast.success as jest.Mock).mockReset();
    (createWorkspace as jest.Mock).mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("renders localized validation errors for invalid workspace names", async () => {
    render(<WorkspaceCreateDialog />);

    const input = screen.getByLabelText("Название рабочего пространства");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);

    expect(await screen.findByText("Введите название рабочего пространства")).toBeInTheDocument();
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

  it("localizes action error keys before showing them inline", async () => {
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
      expect(
        screen.getByText("Введите другое название рабочего пространства; это уже занято")
      ).toBeVisible();
    });
    expect(screen.getByText("Создание рабочего пространства")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
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
      expect(screen.getByText("500")).toBeVisible();
    });
    expect(screen.getByText("Создание рабочего пространства")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("redirects to the created workspace dashboard after success", async () => {
    (createWorkspace as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: "d6qzollaqro6y66v7j52bhqo",
        slug: "acme-team",
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
      expect(mockPush).toHaveBeenCalledWith("/w/acme-team/dashboard");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
