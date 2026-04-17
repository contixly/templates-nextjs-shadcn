import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkspacesEmptyState } from "../../src/features/workspaces/components/ui/workspaces-empty-state";
import { SectionCards } from "../../src/features/dashboard/ui/template/section-cards";
import { ChartAreaInteractive } from "../../src/features/dashboard/ui/template/chart-area-interactive";
import { DataTable } from "../../src/features/dashboard/ui/template/data-table";

const messages = {
  common: {
    words: {
      verbs: {
        continue: "Продолжить",
      },
    },
    ui: {
      themeSwitcher: {
        toggle: "Переключить тему",
      },
    },
  },
  workspaces: {
    ui: {
      emptyState: {
        title: "Пока нет рабочих пространств",
        description: "Создайте первое рабочее пространство, чтобы начать.",
        steps: {
          create: {
            title: "Создайте рабочее пространство",
          },
        },
      },
    },
  },
  dashboard: {
    ui: {
      sectionCards: {
        cards: {
          revenue: {
            label: "Общая выручка",
            trend: "Рост в этом месяце",
            details: "Посетители за последние 6 месяцев",
          },
        },
      },
      chartArea: {
        title: "Всего посетителей",
        descriptionLong: "Всего за последние 3 месяца",
        descriptionShort: "Последние 3 месяца",
        range90d: "Последние 3 месяца",
        range30d: "Последние 30 дней",
        range7d: "Последние 7 дней",
        selectRange: "Выберите период",
      },
      dataTable: {
        dragToReorder: "Перетащите для изменения порядка",
        outline: "Структура",
        customizeColumns: "Настроить колонки",
        addSection: "Добавить раздел",
        view: "Вид",
        selectView: "Выберите вид",
        noResults: "Нет результатов.",
        rowsPerPage: "Строк на странице",
        page: "Страница 1 из 0",
        rows: {
          1: "Титульная страница",
        },
      },
    },
  },
};

const resolveMessage = (namespace: string, key?: string, values?: Record<string, unknown>) => {
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
};

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string, values?: Record<string, unknown>) =>
    resolveMessage(namespace, key, values),
  useLocale: () => "ru",
}));

jest.mock("../../src/features/workspaces/components/forms/workspace-create-dialog", () => ({
  WorkspaceCreateDialog: () => <div data-testid="workspace-create-dialog" />,
}));

jest.mock("../../src/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

describe("localized runtime components", () => {
  it("renders workspace empty state copy from translations", () => {
    render(<WorkspacesEmptyState empty />);

    expect(screen.getByText("Пока нет рабочих пространств")).toBeInTheDocument();
    expect(
      screen.getByText("Создайте первое рабочее пространство, чтобы начать.")
    ).toBeInTheDocument();
    expect(screen.getByText("Создайте рабочее пространство")).toBeInTheDocument();
  });

  it("renders dashboard section card copy from translations", () => {
    render(<SectionCards />);

    expect(screen.getByText("Общая выручка")).toBeInTheDocument();
    expect(screen.getByText("Рост в этом месяце")).toBeInTheDocument();
    expect(screen.getByText("Посетители за последние 6 месяцев")).toBeInTheDocument();
  });

  it("renders dashboard chart copy from translations", () => {
    render(<ChartAreaInteractive />);

    expect(screen.getByText("Всего посетителей")).toBeInTheDocument();
    expect(screen.getByText("Всего за последние 3 месяца")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Выберите период" })).toBeInTheDocument();
  });

  it("renders dashboard table copy from translations", () => {
    render(<DataTable data={[]} />);

    expect(screen.getAllByText("Структура").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Настроить колонки/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить раздел/i })).toBeInTheDocument();
    expect(screen.getByText("Нет результатов.")).toBeInTheDocument();
    expect(screen.getByText("Страница 1 из 0")).toBeInTheDocument();
  });

  it("renders translated dashboard row headers from messages", () => {
    render(
      <DataTable
        data={[
          {
            id: 1,
            header: "Cover page",
            type: "Cover page",
            status: "Done",
            target: "18",
            limit: "5",
            reviewer: "Eddie Lake",
          },
        ]}
      />
    );

    expect(screen.getByText("Титульная страница")).toBeInTheDocument();
  });
});
