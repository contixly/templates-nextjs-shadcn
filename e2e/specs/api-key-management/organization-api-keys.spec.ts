import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import {
  callApiV1WithKey,
  createApiKeyThroughUI,
  deleteApiKeyThroughUI,
  editApiKeyNameThroughUI,
  expectApiKeyCreateDialogDefaults,
} from "../../support/api-keys";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import { createWorkspaceThroughUI } from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

type MeApiResponse = {
  data: {
    principal: {
      type: "user" | "organization";
      userId: string | null;
      organizationId: string | null;
    };
    key: {
      configId: string;
    };
  };
};

type OrganizationsApiResponse = {
  data: Array<{
    id: string;
  }>;
};

type OrganizationMembersApiResponse = {
  data: Array<{
    userId: string;
  }>;
};

test.describe("api-key-management: organization API keys", () => {
  test("creates, uses, separates, updates, and deletes organization keys", async ({ page }) => {
    test.slow();

    await signInLocalAutomationUser(page, {
      name: "E2E API Keys Organization Owner",
    });
    const suffix = Date.now().toString(36);
    const workspaceName = `E2E API Keys ${suffix}`;
    const organizationKeyName = `o-e2e-${suffix}`;
    const renamedOrganizationKeyName = `o-e2e-${suffix}-renamed`;
    const personalKeyName = `p-sibling-${suffix}`;
    let personalSecretCreated = false;

    try {
      const organizationKey = await createWorkspaceThroughUI(page, workspaceName);
      await page.goto(routes.workspaceSettingsApiKeys(organizationKey));

      await expect(page.getByRole("heading", { level: 1, name: "API Keys" })).toBeVisible();
      await expect(
        page.getByText("Organization keys act as a service principal for one organization.")
      ).toBeVisible();
      await expect(
        page.getByText("They are not reduced when the creator later changes role or leaves.")
      ).toBeVisible();
      await expect(
        page.getByText("Both key types are limited by the API scopes selected on the key.")
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Manage personal keys" })).toHaveAttribute(
        "href",
        routes.personalApiKeys
      );

      await expectApiKeyCreateDialogDefaults(page, {
        defaultPresetLabel: "Organization read all",
      });

      const organizationSecret = await createApiKeyThroughUI(page, {
        name: organizationKeyName,
        additionalPresetLabels: ["Basic read"],
      });
      expect(organizationSecret).toMatch(/^org_/);

      const meResponse = await callApiV1WithKey<MeApiResponse>(
        page,
        routes.apiV1Me,
        organizationSecret
      );
      expect(meResponse.status).toBe(200);
      expect(meResponse.body).toMatchObject({
        data: {
          principal: {
            type: "organization",
            userId: null,
          },
          key: {
            configId: "org-keys",
          },
        },
      });
      const organizationId = meResponse.body.data.principal.organizationId as string;
      expect(organizationId).toBeTruthy();

      await page.goto(routes.workspaceSettingsApiKeys(organizationId));
      await expect(page).toHaveURL(routes.workspaceSettingsApiKeys(organizationKey));
      await expect(page.getByRole("heading", { level: 1, name: "API Keys" })).toBeVisible();
      await expect(page.getByText(organizationKeyName, { exact: true })).toBeVisible();

      const organizationsResponse = await callApiV1WithKey<OrganizationsApiResponse>(
        page,
        routes.apiV1Organizations,
        organizationSecret
      );
      expect(organizationsResponse.status).toBe(200);
      expect(organizationsResponse.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: organizationId })])
      );

      const membersResponse = await callApiV1WithKey<OrganizationMembersApiResponse>(
        page,
        routes.apiV1OrganizationMembers(organizationId),
        organizationSecret
      );
      expect(membersResponse.status).toBe(200);
      expect(membersResponse.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ userId: expect.any(String) })])
      );

      await page.goto(routes.personalApiKeys);
      await expect(page.getByText(organizationKeyName, { exact: true })).toHaveCount(0);
      await createApiKeyThroughUI(page, {
        name: personalKeyName,
      });
      personalSecretCreated = true;
      await expect(page.getByText(personalKeyName, { exact: true })).toBeVisible();
      await expect(page.getByText(organizationKeyName, { exact: true })).toHaveCount(0);

      await page.goto(routes.workspaceSettingsApiKeys(organizationKey));
      await expect(page.getByText(organizationKeyName, { exact: true })).toBeVisible();
      await expect(page.getByText(personalKeyName, { exact: true })).toHaveCount(0);

      await editApiKeyNameThroughUI(page, organizationKeyName, renamedOrganizationKeyName);
      await expect(page.getByText(renamedOrganizationKeyName, { exact: true })).toBeVisible();

      await deleteApiKeyThroughUI(page, renamedOrganizationKeyName);
      await expect(page.getByText(renamedOrganizationKeyName, { exact: true })).toHaveCount(0);

      const deletedResponse = await callApiV1WithKey(page, routes.apiV1Me, organizationSecret);
      expect(deletedResponse.status).toBe(401);
      expect(deletedResponse.body).toMatchObject({
        error: {
          code: "api_key_invalid",
        },
      });

      if (personalSecretCreated) {
        await page.goto(routes.personalApiKeys);
        await deleteApiKeyThroughUI(page, personalKeyName);
      }
    } finally {
      await cleanupLocalAutomationUser(page);
    }
  });
});
