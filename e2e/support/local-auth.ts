import { expect, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";
import { routes } from "./routes";

type LocalAutomationAuthTarget = APIRequestContext | Page;

export type LocalAutomationScenario = {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified?: boolean;
    image?: string | null;
  };
  email: string;
  password: string;
  cleanupUrl: string;
};

export type LocalAutomationSignInOptions = {
  name?: string;
  email?: string;
  password?: string;
  redirect?: string;
};

export type LocalAutomationCleanup = {
  deletedOrganizations: number;
};

type LocalAutomationSuccessResponse<TData> = {
  success: true;
  data: TData;
};

const LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS = 30_000;
const LOCAL_AUTOMATION_COLD_ROUTE_RETRY_ATTEMPTS = 3;
const LOCAL_AUTOMATION_COLD_ROUTE_RETRY_DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const resolveRequest = (target: LocalAutomationAuthTarget): APIRequestContext => {
  if ("request" in target) {
    return target.request;
  }

  return target;
};

const parseResponseJson = (response: APIResponse, text: string) => {
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

const postLocalAutomationScenario = async (
  request: APIRequestContext,
  options: LocalAutomationSignInOptions
) => {
  const response = await request.post(routes.localAutomationScenario, {
    data: options,
    timeout: LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS,
  });

  return {
    response,
    text: await response.text(),
  };
};

export const signInLocalAutomationUser = async (
  target: LocalAutomationAuthTarget,
  options: LocalAutomationSignInOptions = {}
): Promise<LocalAutomationScenario> => {
  const request = resolveRequest(target);
  let result = await postLocalAutomationScenario(request, options);

  for (
    let attempt = 1;
    isColdRouteNotFoundResponse(result.response, result.text) &&
    attempt < LOCAL_AUTOMATION_COLD_ROUTE_RETRY_ATTEMPTS;
    attempt += 1
  ) {
    await delay(LOCAL_AUTOMATION_COLD_ROUTE_RETRY_DELAY_MS * attempt);
    result = await postLocalAutomationScenario(request, options);
  }

  const body = parseResponseJson(result.response, result.text);

  expect(result.response.status(), JSON.stringify(body)).toBe(201);
  expect(body).toMatchObject({
    success: true,
    data: {
      cleanupUrl: routes.localAutomationScenario,
    },
  });

  return (body as LocalAutomationSuccessResponse<LocalAutomationScenario>).data;
};

export const cleanupLocalAutomationUser = async (
  target: LocalAutomationAuthTarget
): Promise<LocalAutomationCleanup> => {
  const request = resolveRequest(target);
  const response = await request.delete(routes.localAutomationScenario, {
    timeout: LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS,
  });
  const body = parseResponseJson(response, await response.text());

  expect(response.status(), JSON.stringify(body)).toBe(200);
  expect(body).toMatchObject({
    success: true,
    data: {
      deletedOrganizations: expect.any(Number),
    },
  });

  return (body as LocalAutomationSuccessResponse<LocalAutomationCleanup>).data;
};
