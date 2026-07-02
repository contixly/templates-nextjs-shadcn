import type { BrowserContext, Page } from "@playwright/test";
import { cleanupLocalAutomationUser, signInLocalAutomationUser } from "../../support/local-auth";
import { expect, test } from "../../support/test";
import { routes } from "../../support/routes";
import {
  addExistingLocalAutomationUserAsWorkspaceMember,
  createWorkspaceThroughUI,
} from "../../support/workspaces";

test.use({ viewport: { width: 1440, height: 1100 } });

const getSettingsRail = (page: Page) => page.locator('[data-slot="settings-page-rail"]');

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

const expectNoActiveTeamControls = async (page: Page) => {
  const settingsRail = getSettingsRail(page);

  await expect(
    settingsRail.getByText(/active team|set active|clear active/i).filter({ visible: true })
  ).toHaveCount(0);
  await expect(
    settingsRail.getByRole("button", { name: /active team|set active|clear active/i })
  ).toHaveCount(0);
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

test.describe("workspace-team-management: workspace teams", () => {
  test("manages teams, membership, and read-only member access without active-team controls", async ({
    browser,
    page: ownerPage,
  }) => {
    test.slow();

    let ownerSignedIn = false;
    let memberContext: BrowserContext | null = null;
    let memberPage: Page | null = null;
    let memberSignedIn = false;

    try {
      await signInLocalAutomationUser(ownerPage, {
        name: "E2E Workspace Teams Owner",
      });
      ownerSignedIn = true;
      const suffix = Date.now().toString(36);
      const organizationKey = await createWorkspaceThroughUI(ownerPage, `E2E Teams ${suffix}`);
      const teamName = `E2E Team ${suffix}`;
      const renamedTeamName = `E2E Team Renamed ${suffix}`;

      memberContext = await browser.newContext();
      memberPage = await memberContext.newPage();
      const member = await signInLocalAutomationUser(memberPage, {
        name: "E2E Team Participant",
      });
      memberSignedIn = true;

      await addExistingLocalAutomationUserAsWorkspaceMember(ownerPage, {
        organizationKey,
        userId: member.user.id,
        email: member.email,
      });

      await ownerPage.goto(routes.workspaceSettingsTeams(organizationKey));
      await expect(ownerPage.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();
      const teamsRegion = getWorkspaceTeamsRegion(ownerPage);
      await expect(teamsRegion).toBeVisible();
      await expect(teamsRegion.getByText("No teams yet")).toBeVisible();
      await expectNoActiveTeamControls(ownerPage);

      await ownerPage.getByLabel("Team name").first().fill(teamName);
      await ownerPage.getByRole("button", { name: "Create" }).click();
      await expect(ownerPage.getByText("Team created successfully")).toBeVisible();
      await expect(getTeamCard(ownerPage, teamName)).toBeVisible();
      await expect(getTeamCard(ownerPage, teamName).getByText("0 member(s)")).toBeVisible();

      await ownerPage.getByLabel("Team name").first().fill(teamName);
      await ownerPage.getByRole("button", { name: "Create" }).click();
      await expect(
        ownerPage.getByText("A team with this name already exists in this workspace")
      ).toBeVisible();
      await expect(getTeamCard(ownerPage, teamName)).toHaveCount(1);

      await getTeamCard(ownerPage, teamName).getByLabel("Team name").fill(renamedTeamName);
      await getTeamCard(ownerPage, teamName).getByRole("button", { name: "Save" }).click();
      await expect(ownerPage.getByText("Team renamed successfully")).toBeVisible();
      await expect(getTeamCard(ownerPage, renamedTeamName)).toBeVisible();
      await expect(getTeamCard(ownerPage, teamName)).toHaveCount(0);

      await getTeamCard(ownerPage, renamedTeamName).getByLabel("Add team member").click();
      await ownerPage.getByRole("option", { name: member.user.name }).click();
      await getTeamCard(ownerPage, renamedTeamName).getByRole("button", { name: "Add" }).click();
      await expect(ownerPage.getByText("Team member added successfully")).toBeVisible();
      await expect(getTeamCard(ownerPage, renamedTeamName).getByText("1 member(s)")).toBeVisible();

      const memberRow = getTeamMemberRow(ownerPage, renamedTeamName, member.email);
      await expect(memberRow).toBeVisible();
      await expect(memberRow.getByText(member.email, { exact: true })).toBeVisible();
      await expect(memberRow.getByText("member", { exact: true })).toBeVisible();

      await memberPage.goto(routes.workspaceSettingsTeams(organizationKey));
      await expect(memberPage.getByRole("heading", { level: 1, name: "Teams" })).toBeVisible();
      await expect(getSettingsRail(memberPage).getByText("Read-only team access")).toBeVisible();
      await expect(getTeamCard(memberPage, renamedTeamName)).toBeVisible();
      await expect(getTeamMemberRow(memberPage, renamedTeamName, member.email)).toBeVisible();
      await expect(getSettingsRail(memberPage).getByLabel("Team name")).toHaveCount(0);
      await expect(getSettingsRail(memberPage).getByRole("button", { name: "Create" })).toHaveCount(
        0
      );
      await expect(getSettingsRail(memberPage).getByRole("button", { name: "Delete" })).toHaveCount(
        0
      );
      await expect(getSettingsRail(memberPage).getByLabel("Add team member")).toHaveCount(0);
      await expect(
        getSettingsRail(memberPage).getByRole("button", { name: /Remove .* from team/i })
      ).toHaveCount(0);
      await expectNoActiveTeamControls(memberPage);

      await getTeamMemberRow(ownerPage, renamedTeamName, member.email)
        .getByRole("button", { name: `Remove ${member.user.name} from team` })
        .click();
      await expect(ownerPage.getByText("Team member removed successfully")).toBeVisible();
      await expect(getTeamMemberRow(ownerPage, renamedTeamName, member.email)).toHaveCount(0);
      await expect(getTeamCard(ownerPage, renamedTeamName).getByText("0 member(s)")).toBeVisible();

      await getTeamCard(ownerPage, renamedTeamName).getByRole("button", { name: "Delete" }).click();
      const deleteDialog = ownerPage
        .getByRole("alertdialog")
        .filter({ hasText: `Delete ${renamedTeamName}?` });
      await expect(deleteDialog.getByText(`Delete ${renamedTeamName}?`)).toBeVisible();
      await deleteDialog.getByRole("button", { name: "Delete" }).click();
      await expect(ownerPage.getByText("Team deleted successfully")).toBeVisible();
      await expect(getTeamCard(ownerPage, renamedTeamName)).toHaveCount(0);
      await expect(teamsRegion.getByText("No teams yet")).toBeVisible();
      await expectNoActiveTeamControls(ownerPage);
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
});
