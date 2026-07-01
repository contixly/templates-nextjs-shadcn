/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { updateApiKeyForCurrentUser } from "@features/api-keys/actions/update-api-key";
import type { ApiKeyListItemDto } from "@features/api-keys/api-keys-types";
import { ApiKeyEditDialog } from "@features/api-keys/components/api-key-edit-dialog";

jest.mock("next-intl", () => ({
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

jest.mock("@components/ui/custom/modal", () => ({
  Modal: ({ children, trigger }: { children?: React.ReactNode; trigger?: React.ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}));

jest.mock("@features/api-keys/actions/update-api-key", () => ({
  updateApiKeyForCurrentUser: jest.fn(),
}));

const updateApiKeyForCurrentUserMock = jest.mocked(updateApiKeyForCurrentUser);

const baseApiKey = {
  id: "key1",
  configId: "user-keys",
  name: "Existing integration",
  start: "key_abcd",
  prefix: "key_",
  referenceId: "user1",
  enabled: true,
  status: "active",
  permissions: {
    basic: ["read"],
  },
  rateLimitEnabled: true,
  rateLimitTimeWindow: 3_600_000,
  rateLimitMax: 1000,
  requestCount: 0,
  remaining: null,
  lastRequest: null,
  expiresAt: new Date("2026-07-30T00:00:00.000Z"),
  createdAt: new Date("2026-06-01T00:00:00.000Z"),
  updatedAt: new Date("2026-06-01T00:00:00.000Z"),
} satisfies ApiKeyListItemDto;

const renderDialog = (apiKey: ApiKeyListItemDto = baseApiKey) => {
  render(
    <ApiKeyEditDialog
      ownerType="user"
      apiKey={apiKey}
      trigger={<button type="button">Open edit dialog</button>}
    />
  );
};

const renameKey = async (nextName: string) => {
  fireEvent.change(await screen.findByLabelText("form.nameLabel"), {
    target: { value: nextName },
  });
};

const save = async () => {
  const saveButton = screen.getByRole("button", { name: "words.verbs.save" });
  await waitFor(() => expect(saveButton).toBeEnabled());
  fireEvent.click(saveButton);
};

describe("ApiKeyEditDialog", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
    jest.spyOn(Date, "now").mockReturnValue(new Date("2026-06-30T00:00:00.000Z").getTime());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    updateApiKeyForCurrentUserMock.mockResolvedValue({
      success: true,
      data: baseApiKey,
    });
  });

  afterEach(() => {
    updateApiKeyForCurrentUserMock.mockReset();
  });

  it("preserves custom-only permissions when saving an unrelated name change", async () => {
    renderDialog({
      ...baseApiKey,
      permissions: {
        invoices: ["read"],
      },
    });

    await renameKey("Renamed integration");
    await save();

    await waitFor(() =>
      expect(updateApiKeyForCurrentUserMock).toHaveBeenCalledWith({
        type: "user",
        organizationId: undefined,
        organizationKey: undefined,
        keyId: "key1",
        name: "Renamed integration",
      })
    );
  });

  it("renews expiration explicitly when the current expiration option is unchanged", async () => {
    renderDialog();

    fireEvent.click(await screen.findByRole("switch", { name: "form.renewExpirationLabel" }));
    await save();

    await waitFor(() =>
      expect(updateApiKeyForCurrentUserMock).toHaveBeenCalledWith({
        type: "user",
        organizationId: undefined,
        organizationKey: undefined,
        keyId: "key1",
        expiresIn: "30d",
      })
    );
  });

  it("does not renew expiration when only the name changes", async () => {
    renderDialog();

    await renameKey("Rename without renewal");
    await save();

    await waitFor(() =>
      expect(updateApiKeyForCurrentUserMock).toHaveBeenCalledWith({
        type: "user",
        organizationId: undefined,
        organizationKey: undefined,
        keyId: "key1",
        name: "Rename without renewal",
      })
    );
  });

  it("resets explicit renewal state when the dialog is canceled", async () => {
    renderDialog();

    fireEvent.click(await screen.findByRole("switch", { name: "form.renewExpirationLabel" }));
    expect(screen.getByRole("button", { name: "words.verbs.save" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "words.verbs.cancel" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "words.verbs.save" })).toBeDisabled()
    );
  });
});
