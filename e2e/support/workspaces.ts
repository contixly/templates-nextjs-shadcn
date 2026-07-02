import { expect, type Page } from "@playwright/test";
import { routes } from "./routes";

export type AddWorkspaceMemberOptions = {
  organizationKey: string;
  userId: string;
  email: string;
};

export type UpdateWorkspaceSettingsOptions = {
  organizationKey: string;
  name?: string;
  slug?: string;
  allowedEmailDomains?: string;
};

const workspaceDashboardPathPattern = /^\/w\/([^/]+)\/dashboard$/;
const defaultWorkspaceUiPattern = /default workspace|set as default|default-specific/i;
const WORKSPACE_NAVIGATION_TIMEOUT_MS = 60_000;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const clickHydratedModalTrigger = async (page: Page, name: string | RegExp) => {
  const trigger = page.getByRole("button", { name }).first();

  await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
  await trigger.click();
};

const getOpenModal = (page: Page, title: string) =>
  page.getByRole("alertdialog").filter({ hasText: title }).first();

export const extractOrganizationKeyFromPath = (page: Page, pathPattern = /^\/w\/([^/]+)/) => {
  const organizationKey = new URL(page.url()).pathname.match(pathPattern)?.[1];
  expect(organizationKey, `Could not extract organization key from ${page.url()}`).toBeTruthy();

  return decodeURIComponent(organizationKey as string);
};

export const createWorkspaceThroughUI = async (page: Page, name: string) => {
  await page.goto(routes.workspaces);
  await clickHydratedModalTrigger(page, /Create (New )?Workspace/);

  const dialog = getOpenModal(page, "Create New Workspace");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Workspace Name").fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/w\/[^/]+\/dashboard$/, {
    timeout: WORKSPACE_NAVIGATION_TIMEOUT_MS,
  });

  return extractOrganizationKeyFromPath(page, workspaceDashboardPathPattern);
};

export const getWorkspaceCard = (page: Page, workspaceName: string) =>
  page.locator('[data-slot="card"]').filter({
    has: page.getByText(workspaceName, { exact: true }),
  });

export const expectWorkspaceCardVisible = async (
  page: Page,
  options: { name: string; slug: string }
) => {
  const card = getWorkspaceCard(page, options.name);

  await expect(card).toBeVisible();
  await expect(card.getByText(options.slug, { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "Open" })).toHaveAttribute(
    "href",
    routes.workspace(options.slug)
  );
  await expect(card.getByRole("link", { name: "Settings" })).toHaveAttribute(
    "href",
    routes.workspaceSettingsWorkspace(options.slug)
  );
};

export const expectNoDefaultWorkspaceUi = async (page: Page) => {
  await expect(page.getByText(defaultWorkspaceUiPattern).filter({ visible: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: defaultWorkspaceUiPattern })).toHaveCount(0);
  await expect(page.getByRole("link", { name: defaultWorkspaceUiPattern })).toHaveCount(0);
};

export const expectWorkspaceDeleteControlVisible = async (page: Page, workspaceName: string) => {
  await expect(
    getWorkspaceCard(page, workspaceName).getByRole("button", { name: "Delete" })
  ).toBeVisible();
};

export const expectWorkspaceDeleteControlHidden = async (page: Page, workspaceName: string) => {
  await expect(
    getWorkspaceCard(page, workspaceName).getByRole("button", { name: "Delete" })
  ).toHaveCount(0);
};

export const updateWorkspaceSettingsThroughUI = async (
  page: Page,
  options: UpdateWorkspaceSettingsOptions
) => {
  await page.goto(routes.workspaceSettingsWorkspace(options.organizationKey));

  if (options.name !== undefined) {
    await page.getByLabel("Workspace Name").fill(options.name);
  }

  if (options.slug !== undefined) {
    await page.getByLabel("Workspace Slug").fill(options.slug);
  }

  if (options.allowedEmailDomains !== undefined) {
    const allowedEmailDomainsField = page.getByLabel("Allowed Email Domains");

    if (options.allowedEmailDomains.length === 0) {
      await allowedEmailDomainsField.click();
      await allowedEmailDomainsField.press("ControlOrMeta+A");
      await allowedEmailDomainsField.press("Backspace");
    } else {
      await allowedEmailDomainsField.fill(options.allowedEmailDomains);
    }

    await expect(allowedEmailDomainsField).toHaveValue(options.allowedEmailDomains);
  }

  await expect(page.getByRole("button", { name: "Save" })).toBeEnabled();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Workspace updated successfully")).toBeVisible();
};

export const switchWorkspaceFromSidebar = async (
  page: Page,
  currentWorkspaceName: string,
  targetWorkspaceName: string,
  expectedPath: string | RegExp
) => {
  await page.getByRole("button").filter({ hasText: currentWorkspaceName }).first().click();
  await page.getByRole("menuitem", { name: new RegExp(escapeRegExp(targetWorkspaceName)) }).click();
  await expect(page).toHaveURL(expectedPath);
};

export const switchWorkspaceFromBreadcrumb = async (
  page: Page,
  currentWorkspaceName: string,
  targetWorkspaceName: string,
  expectedPath: string | RegExp
) => {
  const breadcrumb = page.getByRole("navigation", { name: "breadcrumb" });

  await breadcrumb.getByText(currentWorkspaceName, { exact: true }).click();
  await page.getByRole("menuitem", { name: new RegExp(escapeRegExp(targetWorkspaceName)) }).click();
  await expect(page).toHaveURL(expectedPath);
};

export const addExistingLocalAutomationUserAsWorkspaceMember = async (
  page: Page,
  options: AddWorkspaceMemberOptions
) => {
  await page.goto(routes.workspaceSettingsUsers(options.organizationKey));
  await clickHydratedModalTrigger(page, "Add Member");

  const dialog = getOpenModal(page, "Add Existing User");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("User ID").fill(options.userId);
  await dialog.getByRole("button", { name: "Add" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(options.email)).toBeVisible();
};

export const addExistingLocalAutomationUserWithDomainWarning = async (
  page: Page,
  options: AddWorkspaceMemberOptions
) => {
  await page.goto(routes.workspaceSettingsUsers(options.organizationKey));
  await clickHydratedModalTrigger(page, "Add Member");

  const dialog = getOpenModal(page, "Add Existing User");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("User ID").fill(options.userId);
  await dialog.getByRole("button", { name: "Add" }).click();

  await expect(dialog.getByText("Email domain outside policy")).toBeVisible();
  await expect(dialog.getByText(options.email)).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm Add" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(options.email)).toBeVisible();
};
