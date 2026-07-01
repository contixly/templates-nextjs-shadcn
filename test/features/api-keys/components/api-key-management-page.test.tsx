/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { ApiKeyManagementPageData } from "@features/api-keys/api-keys-types";

jest.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string, values?: Record<string, string | number>) =>
    values?.count ? `${key} ${values.count}` : key,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

jest.mock("@hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@features/api-keys/actions/create-api-key", () => ({
  createApiKeyForCurrentUser: jest.fn(),
}));

jest.mock("@features/api-keys/actions/update-api-key", () => ({
  updateApiKeyForCurrentUser: jest.fn(),
}));

jest.mock("@features/api-keys/actions/delete-api-key", () => ({
  deleteApiKeyForCurrentUser: jest.fn(),
}));

import { ApiKeyManagementPage } from "@features/api-keys/components/api-key-management-page";

const pageData = {
  ownerType: "organization",
  organizationId: "org1",
  organizationKey: "acme",
  keys: [
    {
      id: "key1",
      configId: "org-keys",
      name: "Warehouse sync",
      start: "org_abcd",
      prefix: "org_",
      referenceId: "org1",
      enabled: true,
      status: "active",
      permissions: {
        organization: ["read"],
        member: ["read"],
      },
      rateLimitEnabled: true,
      rateLimitTimeWindow: 86_400_000,
      rateLimitMax: 1000,
      requestCount: 12,
      remaining: null,
      lastRequest: new Date("2026-06-20T10:00:00.000Z"),
      expiresAt: null,
      createdAt: new Date("2026-06-10T10:00:00.000Z"),
      updatedAt: new Date("2026-06-11T10:00:00.000Z"),
    },
  ],
  capabilities: {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
  },
} satisfies ApiKeyManagementPageData;

describe("ApiKeyManagementPage", () => {
  it("renders education copy, personal-key link, and key table rows", () => {
    render(<ApiKeyManagementPage pageData={pageData} showIntro={false} />);

    expect(screen.getByText("education.title")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "education.personalLink" })).toHaveAttribute(
      "href",
      "/user/api-keys"
    );
    expect(screen.getByText("Warehouse sync")).toBeInTheDocument();
    expect(screen.getByText("org_abcd")).toBeInTheDocument();
  });

  it("renders read-only notice when mutations are not allowed", () => {
    render(
      <ApiKeyManagementPage
        pageData={{
          ...pageData,
          capabilities: {
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          },
        }}
        showIntro={false}
      />
    );

    expect(screen.getByText("table.readOnlyNotice")).toBeInTheDocument();
  });

  it("renders empty state without keys", () => {
    render(
      <ApiKeyManagementPage
        pageData={{
          ...pageData,
          ownerType: "user",
          organizationId: undefined,
          organizationKey: undefined,
          keys: [],
        }}
        showIntro={false}
      />
    );

    expect(screen.getByText("table.emptyTitle")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "education.personalLink" })).not.toBeInTheDocument();
  });
});
