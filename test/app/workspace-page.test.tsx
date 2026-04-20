import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import routes from "../../src/features/routes";
import { findFirstWorkspaceByIdAndUserId } from "../../src/features/workspaces/workspaces-repository";
import { loadCurrentUserId } from "../../src/features/accounts/accounts-actions";
import { loadWorkspace } from "../../src/features/workspaces/actions/load-workspace";

jest.mock("../../src/features/accounts/accounts-actions", () => ({
  loadCurrentUserId: jest.fn(),
}));

jest.mock("../../src/features/workspaces/workspaces-repository", () => ({
  findFirstWorkspaceByIdAndUserId: jest.fn(),
}));

jest.mock("../../src/features/workspaces/actions/load-workspace", () => ({
  loadWorkspace: jest.fn(),
}));

jest.mock("../../src/lib/metadata", () => ({
  buildPageMetadata: jest.fn(async () => ({ title: "Workspace" })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  forbidden: jest.fn(() => {
    throw new Error("forbidden");
  }),
  unauthorized: jest.fn(() => {
    throw new Error("unauthorized");
  }),
}));

describe("workspace page route", () => {
  beforeEach(() => {
    (loadCurrentUserId as jest.Mock).mockReset();
    (findFirstWorkspaceByIdAndUserId as jest.Mock).mockReset();
    (loadWorkspace as jest.Mock).mockReset();
  });

  it("redirects to the dashboard when the workspace belongs to the current user", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (findFirstWorkspaceByIdAndUserId as jest.Mock).mockResolvedValue({ id: "workspace-123" });
    (loadWorkspace as jest.Mock).mockResolvedValue({
      success: true,
      data: { id: "workspace-123" },
    });

    const module = await import("../../src/app/(protected)/(global)/[workspaceId]/page");

    await expect(
      module.default({ params: Promise.resolve({ workspaceId: "workspace-123" }) })
    ).rejects.toThrow(`redirect:${routes.dashboard.pages.application_dashboard.path()}`);

    expect(findFirstWorkspaceByIdAndUserId).toHaveBeenCalledWith(
      "workspace-123",
      "user-123",
      expect.any(Object)
    );
  });

  it("renders the forbidden route state when the workspace is not accessible", async () => {
    (loadCurrentUserId as jest.Mock).mockResolvedValue("user-123");
    (findFirstWorkspaceByIdAndUserId as jest.Mock).mockResolvedValue(null);
    (loadWorkspace as jest.Mock).mockResolvedValue({
      success: false,
      error: { message: "403" },
    });

    const module = await import("../../src/app/(protected)/(global)/[workspaceId]/page");

    await expect(
      module.default({ params: Promise.resolve({ workspaceId: "workspace-404" }) })
    ).rejects.toThrow("forbidden");
  });
});

describe("workspace page loading route", () => {
  it("renders a loading spinner from loading.tsx", async () => {
    const module = await import("../../src/app/(protected)/(global)/[workspaceId]/loading");

    render(<module.default />);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });
});
