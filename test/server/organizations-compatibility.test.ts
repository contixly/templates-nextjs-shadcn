/** @jest-environment node */

import {
  toWorkspaceDto,
  type OrganizationWorkspaceRecord,
} from "@features/organizations/organizations-dto";
import {
  findOrganizationByRouteKey,
  getOrganizationRouteKey,
  getActiveOrganizationId,
  resolveDefaultOrganizationId,
  resolveUrlOrganizationKey,
} from "@features/organizations/organizations-context";

describe("organization workspace compatibility", () => {
  it("maps an organization record into the legacy workspace dto shape", () => {
    const createdAt = new Date("2026-04-20T10:00:00.000Z");
    const organization: OrganizationWorkspaceRecord = {
      id: "org_123",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: null,
      createdAt,
      isDefault: true,
    };

    expect(toWorkspaceDto(organization)).toEqual({
      id: "org_123",
      name: "Acme",
      slug: "acme",
      logo: null,
      metadata: null,
      createdAt,
      updatedAt: createdAt,
      isDefault: true,
    });
  });

  it("resolves the current url organization key from the organization route param", () => {
    expect(resolveUrlOrganizationKey({ organizationKey: "acme" })).toBe("acme");
    expect(resolveUrlOrganizationKey({ organizationId: "org_123" })).toBe("org_123");
    expect(resolveUrlOrganizationKey({})).toBeNull();
  });

  it("prefers an organization slug when generating route keys and resolves route context by slug or id", () => {
    const organizations = [
      { id: "org_1", slug: "acme" },
      { id: "org_2", slug: null },
    ];

    expect(getOrganizationRouteKey(organizations[0])).toBe("acme");
    expect(getOrganizationRouteKey(organizations[1])).toBe("org_2");
    expect(findOrganizationByRouteKey(organizations, "acme")).toEqual(organizations[0]);
    expect(findOrganizationByRouteKey(organizations, "org_2")).toEqual(organizations[1]);
    expect(findOrganizationByRouteKey(organizations, "missing")).toBeNull();
  });

  it("prefers active organization, then default, then deterministic fallback", () => {
    const accessibleOrganizationIds = ["org_1", "org_2", "org_3"];

    expect(
      resolveDefaultOrganizationId({
        accessibleOrganizationIds,
        activeOrganizationId: "org_2",
        defaultOrganizationId: "org_1",
        fallbackOrganizationId: "org_3",
      })
    ).toBe("org_2");

    expect(
      resolveDefaultOrganizationId({
        accessibleOrganizationIds,
        activeOrganizationId: "missing",
        defaultOrganizationId: "org_1",
        fallbackOrganizationId: "org_3",
      })
    ).toBe("org_1");

    expect(
      resolveDefaultOrganizationId({
        accessibleOrganizationIds,
        activeOrganizationId: null,
        defaultOrganizationId: "missing",
        fallbackOrganizationId: "org_3",
      })
    ).toBe("org_3");

    expect(
      resolveDefaultOrganizationId({
        accessibleOrganizationIds,
        activeOrganizationId: "missing",
        defaultOrganizationId: "missing",
        fallbackOrganizationId: "missing",
      })
    ).toBeNull();
  });

  it("reads the active organization id from the current session shape", () => {
    expect(getActiveOrganizationId({ activeOrganizationId: "org_9" })).toBe("org_9");
    expect(getActiveOrganizationId({})).toBeNull();
    expect(getActiveOrganizationId(null)).toBeNull();
  });
});
