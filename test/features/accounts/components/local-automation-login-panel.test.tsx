import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const routerPushMock = jest.fn();
const routerRefreshMock = jest.fn();
const searchParamsGetMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
    refresh: routerRefreshMock,
  }),
  useSearchParams: () => ({
    get: searchParamsGetMock,
  }),
}));

jest.mock("@lib/routes", () => ({
  sanitizeRedirectPath: (path: string) => path,
}));

import { LocalAutomationLoginPanel } from "@features/accounts/components/forms/local-automation-login-panel";

describe("LocalAutomationLoginPanel", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    routerPushMock.mockReset();
    routerRefreshMock.mockReset();
    searchParamsGetMock.mockReset();
    searchParamsGetMock.mockReturnValue(null);
    global.fetch = fetchMock;
  });

  it("creates a local automation user and navigates to the default dashboard", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          user: { id: "user_1" },
        },
      }),
    });

    render(<LocalAutomationLoginPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Create local automation user" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/local-auth/scenario", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ redirect: "/dashboard" }),
      });
    });

    await waitFor(() => {
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
      expect(routerPushMock).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows the API error message without navigating", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({
        success: false,
        error: {
          message: "local_automation_sign_up_failed",
        },
      }),
    });

    render(<LocalAutomationLoginPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Create local automation user" }));

    expect(await screen.findByText("local_automation_sign_up_failed")).toBeVisible();
    expect(screen.getByText("Local auth failed")).toBeVisible();
    expect(routerPushMock).not.toHaveBeenCalled();
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });
});
