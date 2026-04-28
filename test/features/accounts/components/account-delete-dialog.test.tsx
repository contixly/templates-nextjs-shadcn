import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const push = jest.fn();

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
    const messages = {
      common: {
        words: {
          verbs: {
            cancel: "Отмена",
            delete: "Удалить",
          },
        },
      },
      accounts: {
        validation: {
          errors: {
            confirmationEmailMismatch: "Введите email аккаунта точно как показано",
          },
        },
        ui: {
          deleteDialog: {
            title: "Удалить аккаунт?",
            description: "Описание",
            warningTitle: "Внимание",
            warningData: "Данные будут удалены",
            warningProviders: "Аккаунты будут отвязаны",
            warningSessions: "Сессии будут завершены",
            warningIrreversible: "Действие нельзя отменить",
            confirmationLabel: "Для подтверждения введите “{email}” в поле ниже",
            confirmationPlaceholder: "Введите email для подтверждения удаления",
            success: "Аккаунт успешно удалён",
            errorTitle: "Удаление аккаунта",
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

    if (typeof value !== "string") {
      return path;
    }

    return Object.entries(values ?? {}).reduce(
      (result, [placeholder, replacement]) =>
        result.replaceAll(`{${placeholder}}`, String(replacement)),
      value
    );
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("@components/ui/custom/modal", () => ({
  Modal: ({ children, trigger }: { children?: React.ReactNode; trigger?: React.ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}));

jest.mock("@features/accounts/actions/delete-account", () => ({
  deleteAccount: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { AccountDeleteDialog } from "@features/accounts/components/forms/account-delete-dialog";
import { deleteAccount } from "@features/accounts/actions/delete-account";
import { toast } from "sonner";

describe("AccountDeleteDialog", () => {
  beforeEach(() => {
    (toast.error as jest.Mock).mockReset();
    push.mockReset();
    (deleteAccount as jest.Mock).mockReset();
  });

  it("localizes action error keys before showing them inline", async () => {
    (deleteAccount as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        message: "validation.errors.confirmationEmailMismatch",
      },
    });

    render(<AccountDeleteDialog email="user@example.com" />);

    const input = screen.getByPlaceholderText("Введите email для подтверждения удаления");
    fireEvent.change(input, {
      target: { value: "user@example.com" },
    });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText("Введите email аккаунта точно как показано")).toBeVisible();
    });
    expect(screen.getByText("Удаление аккаунта")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
