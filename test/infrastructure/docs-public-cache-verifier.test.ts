/** @jest-environment node */

import {
  classifyPublicResponse,
  parseVerifierConfig,
  redactError,
  runVerification,
  sha256,
} from "../../scripts/test/verify-docs-public-cache.mjs";

const authCookie = "session=token-secret; profile=profile-secret";

type FetchRequest = {
  headers: Headers;
  method: string;
  redirect: string;
  url: URL;
};

type MockOptions = {
  authenticatedSession?: boolean;
  edgeCacheKey?: (request: FetchRequest) => string;
  edgeReplica?: string;
  initialEdgeCacheKeys?: string[];
  originHeaders?: HeadersInit;
  originBody?: (request: FetchRequest) => string;
};

function verifierConfig() {
  return parseVerifierConfig({
    ORIGIN_BASE_URL: "http://origin.test",
    EDGE_BASE_URL: "http://edge.test",
    AUTH_COOKIE: authCookie,
    EDGE_REPLICA_COUNT: "1",
    MAX_EDGE_REQUESTS: "30",
  });
}

function createMockFetch(options: MockOptions = {}) {
  const requests: FetchRequest[] = [];
  const cache = new Set(options.initialEdgeCacheKeys ?? []);
  const bypassHeaders = [
    "rsc",
    "next-router-state-tree",
    "next-router-prefetch",
    "next-router-segment-prefetch",
    "next-action",
    "authorization",
    "purpose",
    "sec-purpose",
  ];

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const requestInit = init ?? {};
    const request = {
      headers: new Headers(requestInit.headers),
      method: requestInit.method ?? (input instanceof Request ? input.method : "GET"),
      redirect: requestInit.redirect ?? "",
      url,
    };
    requests.push(request);
    const body = Buffer.from(options.originBody?.(request) ?? `<html>${url.pathname}</html>`);

    if (url.host === "origin.test") {
      if (url.pathname === "/api/auth/get-session") {
        return Response.json(
          options.authenticatedSession === false
            ? null
            : { session: { id: "session-id" }, user: { id: "user-id" } }
        );
      }

      return new Response(body, {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600", ...options.originHeaders },
      });
    }

    const bypass =
      url.pathname === "/api/health" ||
      url.pathname.startsWith("/docs/og/") ||
      url.search !== "" ||
      request.method === "POST" ||
      bypassHeaders.some((header) => request.headers.has(header));
    if (bypass) {
      return new Response(body, {
        status: 200,
        headers: {
          "X-Edge-Cache": "BYPASS",
          "X-Edge-Replica": options.edgeReplica ?? "edge-a",
        },
      });
    }

    const key = options.edgeCacheKey?.(request) ?? request.url.pathname;
    const edgeCache = cache.has(key) ? "HIT" : "MISS";
    cache.add(key);
    return new Response(body, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600",
        "X-Edge-Cache": edgeCache,
        "X-Edge-Replica": options.edgeReplica ?? "edge-a",
      },
    });
  };

  return { fetchImpl, requests };
}

describe("public documentation cache verifier", () => {
  test("exports deterministic safe helpers without executing the CLI on import", () => {
    expect(sha256(Buffer.from("docs"))).toMatch(/^[a-f0-9]{64}$/u);
    expect(
      classifyPublicResponse({
        status: 200,
        cacheControl: "public, s-maxage=3600",
        setCookie: null,
        vary: null,
      })
    ).toEqual({ ok: true });
    expect(
      classifyPublicResponse({
        status: 200,
        cacheControl: "private, no-store",
        setCookie: null,
        vary: null,
      })
    ).toMatchObject({ ok: false });
    expect(
      classifyPublicResponse({
        status: 200,
        cacheControl: 'public, private="Set-Cookie"',
        setCookie: null,
        vary: null,
      })
    ).toMatchObject({ ok: false });
    expect(
      classifyPublicResponse({
        status: 200,
        cacheControl: "public",
        setCookie: "session=x",
        vary: null,
      })
    ).toMatchObject({ ok: false });
    expect(
      classifyPublicResponse({ status: 200, cacheControl: "public", setCookie: null, vary: "*" })
    ).toMatchObject({ ok: false });
    const redacted = redactError(new Error(`Cookie: ${authCookie}; token-secret`), authCookie);
    expect(redacted).not.toContain(authCookie);
    expect(redacted).not.toContain("token-secret");
    expect(redacted).not.toContain("profile-secret");
  });

  test("rejects invalid configuration before a fetch can be attempted", () => {
    expect(() =>
      parseVerifierConfig({
        ORIGIN_BASE_URL: "",
        EDGE_BASE_URL: "http://edge.test",
        AUTH_COOKIE: authCookie,
      })
    ).toThrow("ORIGIN_BASE_URL");
    expect(() =>
      parseVerifierConfig({
        ORIGIN_BASE_URL: "http://origin.test",
        EDGE_BASE_URL: "http://edge.test",
        AUTH_COOKIE: authCookie,
        EDGE_REPLICA_COUNT: "0",
      })
    ).toThrow("EDGE_REPLICA_COUNT");
    expect(() =>
      parseVerifierConfig({
        ORIGIN_BASE_URL: "http://origin.test",
        EDGE_BASE_URL: "http://edge.test",
        AUTH_COOKIE: "",
      })
    ).toThrow("AUTH_COOKIE");
    expect(() =>
      parseVerifierConfig({
        ORIGIN_BASE_URL: "http://origin.test",
        EDGE_BASE_URL: "http://edge.test",
        AUTH_COOKIE: authCookie,
        DOCS_PATHS: "/docs,/docs/../private",
      })
    ).toThrow("DOCS_PATHS");
  });

  test("verifies complete origin/edge bodies, cache reuse, bypasses, and safe output", async () => {
    const { fetchImpl, requests } = createMockFetch({
      originBody: (request) =>
        `<html>${request.url.pathname}${request.url.search ? `:${request.url.search}` : ""}</html>`,
    });

    const result = await runVerification(verifierConfig(), fetchImpl);
    expect(result).toMatchObject({
      ok: true,
      origin: { pathCount: 2 },
      edge: {
        bypassCount: 13,
        observedReplicaIds: ["edge-a"],
        replicaCount: 1,
        requestCount: 19,
      },
    });

    expect(requests).toHaveLength(34);
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ redirect: "manual" }),
        expect.objectContaining({ headers: expect.objectContaining({}) }),
      ])
    );
    expect(requests.some((request) => request.headers.get("purpose") === "prefetch")).toBe(true);
    expect(
      requests.some((request) => request.headers.get("next-action") === "cache-verifier")
    ).toBe(true);
    expect(requests.some((request) => request.method === "POST")).toBe(true);
    expect(
      requests.some(
        (request) =>
          request.url.host === "origin.test" &&
          request.url.pathname === "/api/auth/get-session" &&
          request.headers.get("cookie") === authCookie
      )
    ).toBe(true);
    expect(JSON.stringify(result)).not.toContain(authCookie);
    expect(JSON.stringify(result)).not.toContain("token-secret");
    expect(JSON.stringify(result)).not.toContain("profile-secret");

    const edgeRequests = requests.filter((request) => request.url.host === "edge.test");
    expect(edgeRequests.some((request) => request.url.pathname === "/api/health")).toBe(true);
    expect(edgeRequests.some((request) => request.url.pathname === "/docs/og/index")).toBe(true);
    expect(
      edgeRequests.filter((request) => request.url.search === "?cache-verifier=safe")
    ).toHaveLength(2);
    for (const header of [
      "rsc",
      "next-router-state-tree",
      "next-router-prefetch",
      "next-router-segment-prefetch",
      "next-action",
      "authorization",
      "purpose",
      "sec-purpose",
    ]) {
      expect(edgeRequests.some((request) => request.headers.has(header))).toBe(true);
    }
  });

  test("rejects a cookie-specific edge key on its first already-warmed response", async () => {
    const { fetchImpl } = createMockFetch({
      edgeCacheKey: (request) => `${request.url.pathname}|${request.headers.get("cookie") ?? ""}`,
    });

    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.toThrow(
      "expected X-Edge-Cache HIT on first response"
    );
  });

  test("rejects an already-warm replica when a cold cache is required", async () => {
    const { fetchImpl } = createMockFetch({
      initialEdgeCacheKeys: ["/docs", "/docs/general/quick-start"],
    });

    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.toThrow(
      "expected X-Edge-Cache MISS on first response from replica"
    );
  });

  test("rejects an auth cookie that does not resolve to a live origin session", async () => {
    const { fetchImpl } = createMockFetch({ authenticatedSession: false });

    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.toThrow(
      "AUTH_COOKIE does not resolve to a live origin session"
    );
  });

  test.each([
    [
      "body mismatch",
      {
        originBody: (request: FetchRequest) =>
          request.headers.has("cookie") ? "different" : "same",
      },
    ],
    ["redirect", { originHeaders: { Location: "/docs" }, originBody: () => "same" }],
    ["vary wildcard", { originHeaders: { Vary: "*" } }],
  ])("rejects unsafe origin %s", async (_name, options) => {
    const { fetchImpl } = createMockFetch(options);
    if (_name === "redirect") {
      const redirectingFetch: typeof fetch = async (input, init) => {
        const url = new URL(input instanceof Request ? input.url : input);
        if (url.host === "origin.test") {
          return new Response("redirect", { status: 302, headers: { Location: "/docs" } });
        }
        return fetchImpl(input, init);
      };
      await expect(runVerification(verifierConfig(), redirectingFetch)).rejects.toThrow();
      return;
    }

    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.toThrow();
  });

  test("rejects a response body containing only a parsed auth-cookie value", async () => {
    const { fetchImpl } = createMockFetch({ originBody: () => "token-secret" });

    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.toThrow(
      "response body contains configured auth cookie"
    );
  });

  test("rejects malicious replica identifiers without leaking parsed auth values", async () => {
    const { fetchImpl } = createMockFetch({ edgeReplica: "edge-a-token-secret" });

    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.not.toThrow("token-secret");
    await expect(runVerification(verifierConfig(), fetchImpl)).rejects.toThrow("X-Edge-Replica");
  });
});
