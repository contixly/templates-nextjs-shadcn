import type { BrowserContext, Page } from "@playwright/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  addExistingLocalAutomationUserWithDomainWarning,
  createWorkspaceThroughUI,
  expectNoDefaultWorkspaceUi,
  updateWorkspaceSettingsThroughUI,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const cleanupMember = async (page: Page | null, context: BrowserContext | null) => {
  if (page) {
    await cleanupLocalAutomationUser(page);
  }
  if (context) {
    await context.close();
  }
};

test.describe("workspace-organization-management: settings permissions", () => {
  test("updates settings, enforces read-only member access, and applies domain restrictions", async ({
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    await signInLocalAutomationUser(ownerPage, {
      name: "E2E Workspace Settings Owner",
    });
    const suffix = Date.now().toString(36);
    const workspaceName = `E2E Settings ${suffix}`;
    const renamedWorkspaceName = `E2E Settings Renamed ${suffix}`;
    const renamedWorkspaceSlug = `e2e-settings-renamed-${suffix}`;
    let restrictedMemberContext: BrowserContext | null = null;
    let restrictedMemberPage: Page | null = null;
    let unrestrictedMemberContext: BrowserContext | null = null;
    let unrestrictedMemberPage: Page | null = null;

    try {
      const organizationKey = await createWorkspaceThroughUI(ownerPage, workspaceName);

      await updateWorkspaceSettingsThroughUI(ownerPage, {
        organizationKey,
        name: renamedWorkspaceName,
        slug: renamedWorkspaceSlug,
        allowedEmailDomains: "Example.COM\n@example.com",
      });
      await expect(ownerPage).toHaveURL(routes.workspaceSettingsWorkspace(renamedWorkspaceSlug));
      await expect(ownerPage.getByLabel("Workspace Name")).toHaveValue(renamedWorkspaceName);
      await expect(ownerPage.getByLabel("Workspace Slug")).toHaveValue(renamedWorkspaceSlug);
      await expect(ownerPage.getByLabel("Allowed Email Domains")).toHaveValue("example.com");
      await expectNoDefaultWorkspaceUi(ownerPage);

      restrictedMemberContext = await browser.newContext();
      restrictedMemberPage = await restrictedMemberContext.newPage();
      const restrictedMember = await signInLocalAutomationUser(restrictedMemberPage, {
        name: "E2E Workspace Restricted Member",
      });

      await addExistingLocalAutomationUserWithDomainWarning(ownerPage, {
        organizationKey: renamedWorkspaceSlug,
        userId: restrictedMember.user.id,
        email: restrictedMember.email,
      });

      await restrictedMemberPage.goto(routes.workspaceSettingsWorkspace(renamedWorkspaceSlug));
      await expect(
        restrictedMemberPage.getByText(
          "You can review these workspace details, but only admins and owners can update them."
        )
      ).toBeVisible();
      await expect(restrictedMemberPage.getByLabel("Workspace Name")).toBeDisabled();
      await expect(restrictedMemberPage.getByLabel("Workspace Slug")).toBeDisabled();
      await expect(restrictedMemberPage.getByLabel("Allowed Email Domains")).toBeDisabled();
      await expect(restrictedMemberPage.getByRole("button", { name: "Save" })).toHaveCount(0);
      await expect(restrictedMemberPage.getByRole("button", { name: "Delete" })).toHaveCount(0);
      await expectNoDefaultWorkspaceUi(restrictedMemberPage);

      await updateWorkspaceSettingsThroughUI(ownerPage, {
        organizationKey: renamedWorkspaceSlug,
        allowedEmailDomains: "",
      });
      await expect(ownerPage.getByLabel("Allowed Email Domains")).toHaveValue("");

      unrestrictedMemberContext = await browser.newContext();
      unrestrictedMemberPage = await unrestrictedMemberContext.newPage();
      const unrestrictedMember = await signInLocalAutomationUser(unrestrictedMemberPage, {
        name: "E2E Workspace Unrestricted Member",
      });

      await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
        organizationKey: renamedWorkspaceSlug,
        userId: unrestrictedMember.user.id,
        email: unrestrictedMember.email,
      });
    } finally {
      await cleanupMember(restrictedMemberPage, restrictedMemberContext);
      await cleanupMember(unrestrictedMemberPage, unrestrictedMemberContext);
      await cleanupLocalAutomationUser(ownerPage);
    }
  });
});
