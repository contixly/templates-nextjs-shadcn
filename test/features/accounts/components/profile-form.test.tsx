import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { Suspense } from "react";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      common: {
        words: {
          verbs: {
            save: "Сохранить",
          },
        },
      },
      accounts: {
        validation: {
          errors: {
            profileNameRequired: "Введите отображаемое имя",
          },
        },
        ui: {
          profileForm: {
            namePlaceholder: "Введите отображаемое имя",
            nameHint: "Максимум 50 символов",
            success: "Профиль успешно обновлён",
            errorTitle: "Обновление профиля",
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

jest.mock("@features/accounts/actions/update-profile", () => ({
  updateProfile: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

import { ProfileForm } from "@features/accounts/components/forms/profile-form";
import { updateProfile } from "@features/accounts/actions/update-profile";
import { toast } from "sonner";

describe("ProfileForm", () => {
  beforeEach(() => {
    (toast.error as jest.Mock).mockReset();
    (updateProfile as jest.Mock).mockReset();
  });

  it("does not lock the save button to a fixed narrow width", async () => {
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ProfileForm
            loadCurrentUserPromise={Promise.resolve({
              id: "user_1",
              name: "Kroniak",
              email: "kroniak@example.com",
              emailVerified: true,
              image: null,
              createdAt: new Date("2026-04-17T00:00:00.000Z"),
              updatedAt: new Date("2026-04-17T00:00:00.000Z"),
            })}
          />
        </Suspense>
      );
    });

    const button = await screen.findByRole("button", { name: "Сохранить" });

    expect(button).not.toHaveClass("w-14");
    expect(button).toHaveClass("min-w-fit");
  });

  it("localizes action error keys before showing them inline", async () => {
    (updateProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        message: "validation.errors.profileNameRequired",
      },
    });

    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ProfileForm
            loadCurrentUserPromise={Promise.resolve({
              id: "user_1",
              name: "Kroniak",
              email: "kroniak@example.com",
              emailVerified: true,
              image: null,
              createdAt: new Date("2026-04-17T00:00:00.000Z"),
              updatedAt: new Date("2026-04-17T00:00:00.000Z"),
            })}
          />
        </Suspense>
      );
    });

    const input = screen.getByPlaceholderText("Введите отображаемое имя");
    fireEvent.change(input, {
      target: { value: "Kroniak Updated" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Сохранить" })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText("Введите отображаемое имя")).toBeVisible();
    });
    expect(screen.getByText("Обновление профиля")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("passes through non-translated action messages unchanged", async () => {
    (updateProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: {
        message: "404",
      },
    });

    await act(async () => {
      render(
        <Suspense fallback={null}>
          <ProfileForm
            loadCurrentUserPromise={Promise.resolve({
              id: "user_1",
              name: "Kroniak",
              email: "kroniak@example.com",
              emailVerified: true,
              image: null,
              createdAt: new Date("2026-04-17T00:00:00.000Z"),
              updatedAt: new Date("2026-04-17T00:00:00.000Z"),
            })}
          />
        </Suspense>
      );
    });

    const input = screen.getByPlaceholderText("Введите отображаемое имя");
    fireEvent.change(input, {
      target: { value: "Kroniak Updated" },
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Сохранить" })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.submit(input.closest("form")!);
    });

    await waitFor(() => {
      expect(screen.getByText("404")).toBeVisible();
    });
    expect(screen.getByText("Обновление профиля")).toBeVisible();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
