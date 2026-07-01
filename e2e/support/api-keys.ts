import { expect, type APIResponse, type Page } from "@playwright/test";
import { routes } from "./routes";

type ApiV1Response<TBody = unknown> = {
  status: number;
  body: TBody;
  response: APIResponse;
};

type CreateApiKeyOptions = {
  name: string;
  additionalPresetLabels?: string[];
};

type AddWorkspaceMemberOptions = {
  organizationKey: string;
  userId: string;
  email: string;
};

const parseJsonResponse = async (response: APIResponse) => {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Expected JSON response from ${response.url()}, got: ${text}`);
  }
};

const getVisibleApiKeyRow = (page: Page, keyName: string) =>
  page.getByRole("row").filter({ hasText: keyName }).first();

const getApiKeyNameText = (page: Page, keyName: string) => page.getByText(keyName, { exact: true });

const expectApiKeyRowVisible = async (page: Page, keyName: string) => {
  await expect(getVisibleApiKeyRow(page, keyName)).toBeVisible();
};

const expectApiKeyRowHidden = async (page: Page, keyName: string) => {
  await expect(getApiKeyNameText(page, keyName)).toHaveCount(0);
};

const clickHydratedModalTrigger = async (page: Page, name: string | RegExp) => {
  const trigger = page.getByRole("button", { name }).first();

  await expect(trigger).toHaveAttribute("data-slot", "alert-dialog-trigger");
  await trigger.click();
};

const getOpenModal = (page: Page, title: string) =>
  page.getByRole("alertdialog").filter({ hasText: title }).first();

const openApiKeyRowActions = async (page: Page, keyName: string) => {
  const row = getVisibleApiKeyRow(page, keyName);

  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Actions" }).click();
};

export const callApiV1WithKey = async <TBody = unknown>(
  page: Page,
  route: string,
  apiKey: string
): Promise<ApiV1Response<TBody>> => {
  const response = await page.request.get(route, {
    headers: {
      "x-api-key": apiKey,
    },
  });

  return {
    status: response.status(),
    body: (await parseJsonResponse(response)) as TBody,
    response,
  };
};

export const createWorkspaceThroughUI = async (page: Page, name: string) => {
  await page.goto(routes.welcome);
  await clickHydratedModalTrigger(page, "Create Workspace");

  const dialog = getOpenModal(page, "Create New Workspace");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Workspace Name").fill(name);
  await dialog.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/w\/[^/]+\/dashboard$/, { timeout: 30_000 });

  const organizationKey = new URL(page.url()).pathname.match(/^\/w\/([^/]+)\/dashboard$/)?.[1];
  expect(organizationKey, `Could not extract organization key from ${page.url()}`).toBeTruthy();

  return decodeURIComponent(organizationKey as string);
};

export const createApiKeyThroughUI = async (page: Page, options: CreateApiKeyOptions) => {
  await clickHydratedModalTrigger(page, "Create key");

  const dialog = getOpenModal(page, "Create API key");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Name").fill(options.name);

  for (const presetLabel of options.additionalPresetLabels ?? []) {
    const presetField = dialog
      .locator('[data-slot="field"][data-orientation="horizontal"]')
      .filter({ hasText: presetLabel })
      .first();
    const checkbox = presetField.getByRole("checkbox");

    await expect(checkbox).toBeVisible();
    if ((await checkbox.getAttribute("aria-checked")) !== "true") {
      await checkbox.click();
    }
  }

  await expect(dialog.getByRole("button", { name: "Create" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Create" }).click();

  const secretInput = dialog.getByLabel("Copy the API key");
  await expect(secretInput).toBeVisible();
  const secret = await secretInput.inputValue();

  await dialog.getByRole("button", { name: "Close" }).click();
  await expectApiKeyRowVisible(page, options.name);

  return secret;
};

export const editApiKeyNameThroughUI = async (
  page: Page,
  currentName: string,
  nextName: string
) => {
  await openApiKeyRowActions(page, currentName);
  await page.getByRole("menuitem", { name: "Edit" }).click();

  const dialog = getOpenModal(page, "Edit API key");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Name").fill(nextName);
  await expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);

  await expectApiKeyRowVisible(page, nextName);
  await expectApiKeyRowHidden(page, currentName);
};

export const deleteApiKeyThroughUI = async (page: Page, keyName: string) => {
  await openApiKeyRowActions(page, keyName);
  await page.getByRole("menuitem", { name: "Delete" }).click();

  const dialog = getOpenModal(page, "Delete API key?");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expectApiKeyRowHidden(page, keyName);
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

  await expect(page.getByText(options.email)).toBeVisible();
};
