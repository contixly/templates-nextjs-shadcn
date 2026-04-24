/** @jest-environment node */

const updateTagMock = jest.fn();
const revalidateTagMock = jest.fn();

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: (...args: unknown[]) => revalidateTagMock(...args),
  updateTag: (...args: unknown[]) => updateTagMock(...args),
}));

import {
  CACHE_OrganizationByIdTag,
  CACHE_OrganizationsByUserIdTag,
} from "@features/organizations/organizations-types";
import {
  CACHE_WorkspaceByIdTag,
  CACHE_WorkspacesByUserIdTag,
  revalidateWorkspaceCache,
  updateWorkspaceCache,
} from "@features/workspaces/workspaces-types";

describe("workspace cache tags", () => {
  beforeEach(() => {
    updateTagMock.mockReset();
    revalidateTagMock.mockReset();
  });

  it("keeps workspace cache aliases aligned with organization cache names", () => {
    expect(CACHE_WorkspacesByUserIdTag("user_1")).toBe(CACHE_OrganizationsByUserIdTag("user_1"));
    expect(CACHE_WorkspaceByIdTag("org_1")).toBe(CACHE_OrganizationByIdTag("org_1"));
  });

  it("updates each effective cache tag only once", () => {
    updateWorkspaceCache({ userId: "user_1", workspaceId: "org_1" });

    expect(updateTagMock.mock.calls).toEqual([
      [CACHE_OrganizationsByUserIdTag("user_1")],
      [CACHE_OrganizationByIdTag("org_1")],
    ]);
  });

  it("revalidates each effective cache tag only once", () => {
    revalidateWorkspaceCache({ userId: "user_1", workspaceId: "org_1" });

    expect(revalidateTagMock.mock.calls).toEqual([
      [CACHE_OrganizationsByUserIdTag("user_1"), "max"],
      [CACHE_OrganizationByIdTag("org_1"), "max"],
    ]);
  });
});
