import { expect, type APIResponse, type Locator, type Page } from "@playwright/test";

type ApiV1Response<TBody = unknown> = {
  status: number;
  body: TBody;
  response: APIResponse;
};

type CreateApiKeyOptions = {
  name: string;
  additionalPresetLabels?: string[];
};

type ApiKeyCreateDefaultsOptions = {
  defaultPresetLabel: string;
};

const API_V1_COLD_ROUTE_RETRY_ATTEMPTS = 3;
const API_V1_COLD_ROUTE_RETRY_DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseJsonResponse = (response: APIResponse, text: string) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Expected JSON response from ${response.url()}, got: ${text}`);
  }
};

const isJsonResponseBody = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

const isColdRouteNotFoundResponse = (response: APIResponse, text: string): boolean => {
  const bodyStart = text.trimStart().toLowerCase();

  return (
    response.status() === 404 &&
    !isJsonResponseBody(text) &&
    (bodyStart.startsWith("<!doctype html") || bodyStart.startsWith("<html"))
  );
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

const getApiKeyCreateField = (dialog: Locator, label: string) =>
  dialog.locator('[data-slot="field"]').filter({ hasText: label }).first();

const getApiKeyPresetField = (dialog: Locator, presetLabel: string) =>
  dialog
    .locator('[data-slot="field"][data-orientation="horizontal"]')
    .filter({ hasText: presetLabel })
    .first();

const openApiKeyRowActions = async (page: Page, keyName: string) => {
  const row = getVisibleApiKeyRow(page, keyName);

  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Actions" }).click();
};

const requestApiV1WithKey = async (page: Page, route: string, apiKey: string) => {
  const response = await page.request.get(route, {
    headers: {
      "x-api-key": apiKey,
    },
  });

  return {
    response,
    text: await response.text(),
  };
};

export const callApiV1WithKey = async <TBody = unknown>(
  page: Page,
  route: string,
  apiKey: string
): Promise<ApiV1Response<TBody>> => {
  let result = await requestApiV1WithKey(page, route, apiKey);

  for (
    let attempt = 1;
    isColdRouteNotFoundResponse(result.response, result.text) &&
    attempt < API_V1_COLD_ROUTE_RETRY_ATTEMPTS;
    attempt += 1
  ) {
    await delay(API_V1_COLD_ROUTE_RETRY_DELAY_MS * attempt);
    result = await requestApiV1WithKey(page, route, apiKey);
  }

  return {
    status: result.response.status(),
    body: parseJsonResponse(result.response, result.text) as TBody,
    response: result.response,
  };
};

export const expectApiKeyCreateDialogDefaults = async (
  page: Page,
  options: ApiKeyCreateDefaultsOptions
) => {
  await clickHydratedModalTrigger(page, "Create key");

  const dialog = getOpenModal(page, "Create API key");
  await expect(dialog).toBeVisible();

  await expect(dialog.locator('[role="checkbox"][aria-checked="true"]')).toHaveCount(1);
  await expect(
    getApiKeyPresetField(dialog, options.defaultPresetLabel).getByRole("checkbox")
  ).toHaveAttribute("aria-checked", "true");
  await expect(getApiKeyCreateField(dialog, "Expiration")).toContainText("30 days");
  await expect(getApiKeyCreateField(dialog, "Window")).toContainText("1 hour");
  await expect(dialog.getByLabel("Max requests")).toHaveValue("1000");
  await expect(getApiKeyCreateField(dialog, "Rate limit").getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "true"
  );

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
};

export const createApiKeyThroughUI = async (page: Page, options: CreateApiKeyOptions) => {
  await clickHydratedModalTrigger(page, "Create key");

  const dialog = getOpenModal(page, "Create API key");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Name").fill(options.name);

  for (const presetLabel of options.additionalPresetLabels ?? []) {
    const presetField = getApiKeyPresetField(dialog, presetLabel);
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
