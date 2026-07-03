import { type APIResponse, type BrowserContext, type Page } from "@playwright/test";
import { callApiV1WithKey, createApiKeyThroughUI } from "../../support/api-keys";
import { createE2EBrowserContext } from "../../support/browser-context";
import {
  cleanupLocalAutomationUser,
  type LocalAutomationScenario,
  signInLocalAutomationUser,
} from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  createWorkspaceThroughUI,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
  };
};

type ApiDataEnvelope<TData> = {
  data: TData;
};

type ApiV1MeDto = {
  principal: {
    type: "user" | "organization";
    userId: string | null;
    organizationId: string | null;
  };
  key: {
    configId: string;
  };
  permissions: Record<string, string[] | undefined> | null;
};

type OrganizationDto = {
  id: string;
  name: string;
  slug: string;
};

type OrganizationMemberDto = {
  userId: string;
  email: string;
};

type OrganizationTeamDto = {
  id: string;
  organizationId: string;
  name: string;
};

type OrganizationTeamMemberDto = {
  userId: string;
  teamId: string;
  email: string;
};

const parseJsonResponse = async <TBody>(response: APIResponse): Promise<TBody> => {
  const text = await response.text();

  try {
    return JSON.parse(text) as TBody;
  } catch {
    throw new Error(`Expected JSON response from ${response.url()}, got: ${text}`);
  }
};

const callApiV1WithoutKey = async <TBody>(page: Page, route: string) => {
  const response = await page.request.get(route);

  return {
    status: response.status(),
    body: await parseJsonResponse<TBody>(response),
  };
};

const expectApiError = (body: unknown, code: string) => {
  expect(body).toMatchObject({
    error: {
      code,
      message: expect.any(String),
    },
  });
};

const expectDataEnvelopeWithoutSecret = <TData>(body: unknown, secret: string): TData => {
  expect(body).toEqual(
    expect.objectContaining({
      data: expect.anything(),
    })
  );
  expect(JSON.stringify(body)).not.toContain(secret);

  return (body as ApiDataEnvelope<TData>).data;
};

const cleanupSignedInContext = async (
  page: Page | null,
  context: BrowserContext | null,
  signedIn: boolean
) => {
  try {
    if (signedIn && page) {
      await cleanupLocalAutomationUser(page);
    }
  } finally {
    if (context) {
      await context.close();
    }
  }
};

const getWorkspaceTeamsRegion = (page: Page) =>
  page.getByRole("region", { name: "Workspace teams" });

const getTeamCard = (page: Page, teamName: string) =>
  getWorkspaceTeamsRegion(page)
    .locator('[data-slot="card"]')
    .filter({
      has: page.getByText(teamName, { exact: true }),
    });

const getTeamMemberRow = (page: Page, teamName: string, email: string) =>
  getTeamCard(page, teamName)
    .getByRole("row")
    .filter({ has: page.getByText(email, { exact: true }) });

const createWorkspaceTeamThroughUI = async (
  page: Page,
  organizationKey: string,
  teamName: string
) => {
  await page.goto(routes.workspaceSettingsTeams(organizationKey));
  await expect(page.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();

  const teamsRegion = getWorkspaceTeamsRegion(page);
  await expect(teamsRegion).toBeVisible();
  await teamsRegion.getByLabel("Team name").first().fill(teamName);
  await expect(teamsRegion.getByRole("button", { name: "Create" })).toBeEnabled();
  await teamsRegion.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText("Team created successfully")).toBeVisible();
  await expect(getTeamCard(page, teamName)).toBeVisible();
  await expect(getTeamCard(page, teamName).getByText("0 member(s)")).toBeVisible();
};

const addWorkspaceTeamMemberThroughUI = async (
  page: Page,
  teamName: string,
  member: LocalAutomationScenario
) => {
  await getTeamCard(page, teamName).getByLabel("Add team member").click();
  await page.getByRole("option", { name: member.user.name }).click();
  await getTeamCard(page, teamName).getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Team member added successfully")).toBeVisible();
  await expect(getTeamCard(page, teamName).getByText("1 member(s)")).toBeVisible();
  await expect(getTeamMemberRow(page, teamName, member.email)).toBeVisible();
};

const findOrganizationBySlug = (organizations: OrganizationDto[], slug: string) => {
  const organization = organizations.find((item) => item.slug === slug);
  expect(organization, `Expected API response to include organization slug "${slug}"`).toBeTruthy();

  return organization as OrganizationDto;
};

test.describe("api-v1-api-key-access: API key contract", () => {
  test("rejects missing, invalid, and browser-session-only API access", async ({ page }) => {
    let signedIn = false;

    try {
      const missing = await callApiV1WithoutKey<ApiErrorEnvelope>(page, routes.apiV1Me);
      expect(missing.status).toBe(401);
      expectApiError(missing.body, "api_key_missing");

      const blank = await callApiV1WithKey<ApiErrorEnvelope>(page, routes.apiV1Me, "   ");
      expect(blank.status).toBe(401);
      expectApiError(blank.body, "api_key_missing");

      const invalid = await callApiV1WithKey<ApiErrorEnvelope>(
        page,
        routes.apiV1Me,
        "user_invalid_e2e_key"
      );
      expect(invalid.status).toBe(401);
      expectApiError(invalid.body, "api_key_invalid");

      await signInLocalAutomationUser(page, {
        name: "E2E API V1 Auth Boundary",
      });
      signedIn = true;

      const sessionOnly = await callApiV1WithoutKey<ApiErrorEnvelope>(page, routes.apiV1Me);
      expect(sessionOnly.status).toBe(401);
      expectApiError(sessionOnly.body, "api_key_missing");
    } finally {
      if (signedIn) {
        await cleanupLocalAutomationUser(page);
      }
    }
  });

  test("denies organization routes when the key lacks organization permissions", async ({
    page,
  }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E API V1 Permission Boundary",
    });

    try {
      const suffix = Date.now().toString(36);
      await createWorkspaceThroughUI(page, `E2E API V1 Permission ${suffix}`);

      await page.goto(routes.personalApiKeys);
      const secret = await createApiKeyThroughUI(page, {
        name: `p-basic-${suffix}`,
      });

      const organizations = await callApiV1WithKey<ApiErrorEnvelope>(
        page,
        routes.apiV1Organizations,
        secret
      );
      expect(organizations.status).toBe(403);
      expectApiError(organizations.body, "api_key_permission_denied");
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });

  test("allows a personal organization-read-all key to read organization starter endpoints", async ({
    baseURL,
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let memberContext: BrowserContext | null = null;
    let memberPage: Page | null = null;
    let memberSignedIn = false;

    try {
      const scenario = await signInLocalAutomationUser(ownerPage, {
        name: "E2E API V1 Personal Reader",
      });
      ownerSignedIn = true;
      const suffix = Date.now().toString(36);
      const workspaceName = `E2E API V1 Personal ${suffix}`;
      const teamName = `E2E API V1 Team ${suffix}`;
      const organizationKey = await createWorkspaceThroughUI(ownerPage, workspaceName);

      memberContext = await createE2EBrowserContext(browser, baseURL);
      memberPage = await memberContext.newPage();
      const member = await signInLocalAutomationUser(memberPage, {
        name: "E2E API V1 Team Member",
      });
      memberSignedIn = true;

      await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
        organizationKey,
        userId: member.user.id,
        email: member.email,
      });
      await createWorkspaceTeamThroughUI(ownerPage, organizationKey, teamName);
      await addWorkspaceTeamMemberThroughUI(ownerPage, teamName, member);

      await ownerPage.goto(routes.personalApiKeys);
      const secret = await createApiKeyThroughUI(ownerPage, {
        name: `p-org-read-all-${suffix}`,
        additionalPresetLabels: ["Organization read all"],
      });

      const meResponse = await callApiV1WithKey<ApiDataEnvelope<ApiV1MeDto>>(
        ownerPage,
        routes.apiV1Me,
        secret
      );
      expect(meResponse.status).toBe(200);
      const me = expectDataEnvelopeWithoutSecret<ApiV1MeDto>(meResponse.body, secret);
      expect(me).toEqual(
        expect.objectContaining({
          principal: {
            type: "user",
            userId: scenario.user.id,
            organizationId: null,
          },
          key: expect.objectContaining({
            configId: "user-keys",
          }),
        })
      );
      expect(me.permissions).toEqual(
        expect.objectContaining({
          organization: expect.arrayContaining(["read"]),
          member: expect.arrayContaining(["read"]),
          team: expect.arrayContaining(["read"]),
          teamMember: expect.arrayContaining(["read"]),
        })
      );

      const organizationsResponse = await callApiV1WithKey<ApiDataEnvelope<OrganizationDto[]>>(
        ownerPage,
        routes.apiV1Organizations,
        secret
      );
      expect(organizationsResponse.status).toBe(200);
      const organizations = expectDataEnvelopeWithoutSecret<OrganizationDto[]>(
        organizationsResponse.body,
        secret
      );
      const organization = findOrganizationBySlug(organizations, organizationKey);

      const organizationResponse = await callApiV1WithKey<ApiDataEnvelope<OrganizationDto>>(
        ownerPage,
        routes.apiV1Organization(organization.id),
        secret
      );
      expect(organizationResponse.status).toBe(200);
      const organizationDetails = expectDataEnvelopeWithoutSecret<OrganizationDto>(
        organizationResponse.body,
        secret
      );
      expect(organizationDetails).toMatchObject({
        id: organization.id,
        slug: organizationKey,
        name: workspaceName,
      });

      const membersResponse = await callApiV1WithKey<ApiDataEnvelope<OrganizationMemberDto[]>>(
        ownerPage,
        routes.apiV1OrganizationMembers(organization.id),
        secret
      );
      expect(membersResponse.status).toBe(200);
      const members = expectDataEnvelopeWithoutSecret<OrganizationMemberDto[]>(
        membersResponse.body,
        secret
      );
      expect(members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: scenario.user.id,
            email: scenario.email,
          }),
          expect.objectContaining({
            userId: member.user.id,
            email: member.email,
          }),
        ])
      );

      const teamsResponse = await callApiV1WithKey<ApiDataEnvelope<OrganizationTeamDto[]>>(
        ownerPage,
        routes.apiV1OrganizationTeams(organization.id),
        secret
      );
      expect(teamsResponse.status).toBe(200);
      const teams = expectDataEnvelopeWithoutSecret<OrganizationTeamDto[]>(
        teamsResponse.body,
        secret
      );
      const team = teams.find((item) => item.name === teamName);
      expect(team, `Expected API response to include team "${teamName}"`).toBeTruthy();
      const createdTeam = team as OrganizationTeamDto;

      const teamMembersResponse = await callApiV1WithKey<
        ApiDataEnvelope<OrganizationTeamMemberDto[]>
      >(ownerPage, routes.apiV1OrganizationTeamMembers(organization.id, createdTeam.id), secret);
      expect(teamMembersResponse.status).toBe(200);
      const teamMembers = expectDataEnvelopeWithoutSecret<OrganizationTeamMemberDto[]>(
        teamMembersResponse.body,
        secret
      );
      expect(teamMembers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: member.user.id,
            email: member.email,
            teamId: createdTeam.id,
          }),
        ])
      );
    } finally {
      try {
        await cleanupSignedInContext(memberPage, memberContext, memberSignedIn);
      } finally {
        if (ownerSignedIn) {
          await cleanupLocalAutomationUser(ownerPage);
        }
      }
    }
  });

  test("denies personal keys from reading non-member organizations", async ({
    baseURL,
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let otherContext: BrowserContext | null = null;
    let otherPage: Page | null = null;
    let otherSignedIn = false;

    try {
      await signInLocalAutomationUser(ownerPage, {
        name: "E2E API V1 Personal Boundary Owner",
      });
      ownerSignedIn = true;
      const suffix = Date.now().toString(36);
      await createWorkspaceThroughUI(ownerPage, `E2E API V1 Personal Boundary A ${suffix}`);

      await ownerPage.goto(routes.personalApiKeys);
      const ownerSecret = await createApiKeyThroughUI(ownerPage, {
        name: `p-boundary-owner-${suffix}`,
        additionalPresetLabels: ["Organization read all"],
      });

      otherContext = await createE2EBrowserContext(browser, baseURL);
      otherPage = await otherContext.newPage();
      await signInLocalAutomationUser(otherPage, {
        name: "E2E API V1 Personal Boundary Other",
      });
      otherSignedIn = true;
      const otherOrganizationKey = await createWorkspaceThroughUI(
        otherPage,
        `E2E API V1 Personal Boundary B ${suffix}`
      );

      await otherPage.goto(routes.personalApiKeys);
      const otherSecret = await createApiKeyThroughUI(otherPage, {
        name: `p-boundary-other-${suffix}`,
        additionalPresetLabels: ["Organization read all"],
      });
      const otherOrganizationsResponse = await callApiV1WithKey<ApiDataEnvelope<OrganizationDto[]>>(
        otherPage,
        routes.apiV1Organizations,
        otherSecret
      );
      expect(otherOrganizationsResponse.status).toBe(200);
      const otherOrganizations = expectDataEnvelopeWithoutSecret<OrganizationDto[]>(
        otherOrganizationsResponse.body,
        otherSecret
      );
      const otherOrganization = findOrganizationBySlug(otherOrganizations, otherOrganizationKey);

      const deniedResponse = await callApiV1WithKey<ApiErrorEnvelope>(
        ownerPage,
        routes.apiV1Organization(otherOrganization.id),
        ownerSecret
      );
      expect(deniedResponse.status).toBe(403);
      expectApiError(deniedResponse.body, "organization_access_denied");
    } finally {
      try {
        await cleanupSignedInContext(otherPage, otherContext, otherSignedIn);
      } finally {
        if (ownerSignedIn) {
          await cleanupLocalAutomationUser(ownerPage);
        }
      }
    }
  });

  test("limits organization keys to their owning organization", async ({ page }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E API V1 Organization Principal",
    });

    try {
      const suffix = Date.now().toString(36);
      const owningOrganizationKey = await createWorkspaceThroughUI(
        page,
        `E2E API V1 Org Key A ${suffix}`
      );
      const otherOrganizationKey = await createWorkspaceThroughUI(
        page,
        `E2E API V1 Org Key B ${suffix}`
      );

      await page.goto(routes.personalApiKeys);
      const personalSecret = await createApiKeyThroughUI(page, {
        name: `p-org-lookup-${suffix}`,
        additionalPresetLabels: ["Organization read all"],
      });
      const personalOrganizationsResponse = await callApiV1WithKey<
        ApiDataEnvelope<OrganizationDto[]>
      >(page, routes.apiV1Organizations, personalSecret);
      expect(personalOrganizationsResponse.status).toBe(200);
      const personalOrganizations = expectDataEnvelopeWithoutSecret<OrganizationDto[]>(
        personalOrganizationsResponse.body,
        personalSecret
      );
      const owningOrganization = findOrganizationBySlug(
        personalOrganizations,
        owningOrganizationKey
      );
      const otherOrganization = findOrganizationBySlug(personalOrganizations, otherOrganizationKey);

      await page.goto(routes.workspaceSettingsApiKeys(owningOrganizationKey));
      const organizationSecret = await createApiKeyThroughUI(page, {
        name: `o-org-read-all-${suffix}`,
        additionalPresetLabels: ["Organization read all"],
      });

      const organizationsResponse = await callApiV1WithKey<ApiDataEnvelope<OrganizationDto[]>>(
        page,
        routes.apiV1Organizations,
        organizationSecret
      );
      expect(organizationsResponse.status).toBe(200);
      const organizations = expectDataEnvelopeWithoutSecret<OrganizationDto[]>(
        organizationsResponse.body,
        organizationSecret
      );
      expect(organizations).toEqual([expect.objectContaining({ id: owningOrganization.id })]);

      const deniedResponse = await callApiV1WithKey<ApiErrorEnvelope>(
        page,
        routes.apiV1Organization(otherOrganization.id),
        organizationSecret
      );
      expect(deniedResponse.status).toBe(403);
      expectApiError(deniedResponse.body, "organization_access_denied");
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
