import { render, screen } from "@testing-library/react";
import { DocumentsSystemPageMeta } from "@features/documents-system/ui/page/documents-system-page-meta";
import type { DocumentsSystemMetadata } from "@features/documents-system/documents-system-types";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => {
    const messages: Record<string, string | ((values?: Record<string, string>) => string)> = {
      "documentsSystem.ui.page.meta.section": "Section",
      "documentsSystem.ui.page.meta.fallbackLanguage": (values) =>
        `Available in ${values?.locale ?? ""}`,
      "documentsSystem.ui.page.status.published": "Published",
    };

    return (key: string, values?: Record<string, string>) => {
      const value = messages[`${namespace}.${key}`];

      return typeof value === "function" ? value(values) : (value ?? key);
    };
  },
}));

describe("DocumentsSystemPageMeta", () => {
  const meta: DocumentsSystemMetadata = {
    title: "Documentation features",
    description: "Documentation features description",
    group: "General",
    parentItem: "Authoring",
    order: 10,
    status: "published",
    toc: true,
  };

  it("shows a language marker for fallback content", () => {
    render(
      <DocumentsSystemPageMeta
        meta={meta}
        statusTone="default"
        contentLocale="ru"
        isLocaleFallback
      />
    );

    expect(screen.getByText("Available in RU")).not.toBeNull();
  });

  it("does not show a language marker when selected content matches the UI locale", () => {
    render(
      <DocumentsSystemPageMeta
        meta={meta}
        statusTone="default"
        contentLocale="en"
        isLocaleFallback={false}
      />
    );

    expect(screen.queryByText("Available in EN")).toBeNull();
  });
});
