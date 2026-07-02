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

const resolveRequest = (target: LocalAutomationAuthTarget): APIRequestContext => {
  if ("request" in target) {
    return target.request;
  }

  return target;
};

const parseResponseJson = async (response: APIResponse) => {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Expected JSON response from ${response.url()}, got: ${text}`);
  }
};

export const signInLocalAutomationUser = async (
  target: LocalAutomationAuthTarget,
  options: LocalAutomationSignInOptions = {}
): Promise<LocalAutomationScenario> => {
  const request = resolveRequest(target);
  const response = await request.post(routes.localAutomationScenario, {
    data: options,
    timeout: LOCAL_AUTOMATION_REQUEST_TIMEOUT_MS,
  });
  const body = await parseResponseJson(response);

  expect(response.status(), JSON.stringify(body)).toBe(201);
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
  const body = await parseResponseJson(response);

  expect(response.status(), JSON.stringify(body)).toBe(200);
  expect(body).toMatchObject({
    success: true,
    data: {
      deletedOrganizations: expect.any(Number),
    },
  });

  return (body as LocalAutomationSuccessResponse<LocalAutomationCleanup>).data;
};
