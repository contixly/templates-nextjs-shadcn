import { revalidatePath } from "next/cache";
import { z } from "zod";

import { APP_BASE_URL } from "@lib/environment";
import {
  generateLocalAutomationCredentials,
  isLocalAutomationAuthEnabled,
  isLocalAutomationEmail,
  LOCAL_AUTOMATION_AUTH_CLEANUP_PATH,
  type LocalAutomationCredentials,
  type LocalAutomationErrorResponse,
  type LocalAutomationScenarioResponse,
} from "@features/accounts/accounts-local-auth";
import {
  deleteSoleMemberOrganizationsForUser,
  findSoleMemberOrganizationIdsForUser,
} from "@features/accounts/accounts-local-auth-repository";
import { auth } from "@server/auth";
import { HttpCodes } from "@typings/network";

const MAX_GENERATED_SIGN_UP_ATTEMPTS = 3;

const scenarioBodySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    email: z.email().trim().toLowerCase().optional(),
    password: z.string().min(1).optional(),
    redirect: z.string().min(1).optional(),
  })
  .strict();

type ScenarioBody = z.infer<typeof scenarioBodySchema>;

const jsonError = (message: string, code: HttpCodes) =>
  Response.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    } satisfies LocalAutomationErrorResponse,
    { status: code }
  );

const readBody = async (request: Request): Promise<ScenarioBody | Response> => {
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const result = scenarioBodySchema.safeParse(body);
  if (!result.success) {
    return jsonError("local_automation_invalid_request", HttpCodes.BAD_REQUEST);
  }

  return result.data;
};

const buildAuthHeaders = (request: Request) => {
  const headers = new Headers(request.headers);
  const appUrl = new URL(APP_BASE_URL);

  headers.set("content-type", "application/json");
  if (!headers.has("origin")) {
    headers.set("origin", appUrl.origin);
  }
  if (!headers.has("referer")) {
    headers.set("referer", appUrl.href);
  }

  return headers;
};

const responseHeaders = (authResponse: Response) => {
  const headers = new Headers(authResponse.headers);
  headers.set("content-type", "application/json");
  return headers;
};

const buildSignUpRequest = (
  request: Request,
  credentials: LocalAutomationCredentials,
  redirect?: string
) =>
  new Request(new URL("/api/auth/sign-up/email", APP_BASE_URL), {
    method: "POST",
    headers: buildAuthHeaders(request),
    body: JSON.stringify({
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      rememberMe: true,
      ...(redirect ? { callbackURL: redirect } : {}),
    }),
  });

const buildDeleteUserRequest = (request: Request) =>
  new Request(new URL("/api/auth/delete-user", APP_BASE_URL), {
    method: "POST",
    headers: buildAuthHeaders(request),
    body: JSON.stringify({}),
  });

const credentialsForAttempt = (body: ScenarioBody): LocalAutomationCredentials => {
  const generated = generateLocalAutomationCredentials();

  return {
    name: body.name ?? generated.name,
    email: body.email ?? generated.email,
    password: body.password ?? generated.password,
  };
};

export const POST = async (request: Request) => {
  if (!isLocalAutomationAuthEnabled()) {
    return jsonError("local_automation_auth_disabled", HttpCodes.NOT_FOUND);
  }

  const body = await readBody(request);
  if (body instanceof Response) {
    return body;
  }

  if (body.email && !isLocalAutomationEmail(body.email)) {
    return jsonError("local_automation_email_required", HttpCodes.BAD_REQUEST);
  }

  const hasExplicitEmail = Boolean(body.email);
  const maxAttempts = hasExplicitEmail ? 1 : MAX_GENERATED_SIGN_UP_ATTEMPTS;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const credentials = credentialsForAttempt(body);
    const authResponse = await auth.handler(
      buildSignUpRequest(request, credentials, body.redirect)
    );

    if (authResponse.status === 422) {
      if (hasExplicitEmail || attempt === maxAttempts - 1) {
        return jsonError("local_automation_user_exists", HttpCodes.CONFLICT);
      }

      continue;
    }

    if (!authResponse.ok) {
      return jsonError("local_automation_sign_up_failed", HttpCodes.SERVER_ERROR);
    }

    const authBody = (await authResponse.json()) as LocalAutomationScenarioResponse["data"];

    return Response.json(
      {
        success: true,
        data: {
          user: authBody.user,
          email: credentials.email,
          password: credentials.password,
          cleanupUrl: LOCAL_AUTOMATION_AUTH_CLEANUP_PATH,
        },
      } satisfies LocalAutomationScenarioResponse,
      {
        status: HttpCodes.CREATED,
        headers: responseHeaders(authResponse),
      }
    );
  }

  return jsonError("local_automation_sign_up_failed", HttpCodes.SERVER_ERROR);
};

export const DELETE = async (request: Request) => {
  if (!isLocalAutomationAuthEnabled()) {
    return jsonError("local_automation_auth_disabled", HttpCodes.NOT_FOUND);
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return jsonError("local_automation_session_required", HttpCodes.UNAUTHORIZED);
  }

  if (!isLocalAutomationEmail(session.user.email)) {
    return jsonError("local_automation_user_required", HttpCodes.FORBIDDEN);
  }

  const organizationIds = await findSoleMemberOrganizationIdsForUser(session.user.id);
  await deleteSoleMemberOrganizationsForUser(session.user.id, organizationIds);

  const authResponse = await auth.handler(buildDeleteUserRequest(request));
  if (!authResponse.ok) {
    return jsonError("local_automation_cleanup_failed", HttpCodes.SERVER_ERROR);
  }

  revalidatePath("/", "layout");

  return Response.json(
    {
      success: true,
      data: {
        deletedOrganizations: organizationIds.length,
      },
    },
    {
      status: HttpCodes.OK,
      headers: responseHeaders(authResponse),
    }
  );
};
