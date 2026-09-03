import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const DEFAULT_DOCS_PATHS = ["/docs", "/docs/general/quick-start"];
const DEFAULT_EDGE_REPLICA_COUNT = 2;
const DEFAULT_MAX_EDGE_REQUESTS = 80;

export function sha256(body) {
  return createHash("sha256").update(body).digest("hex");
}

export function classifyPublicResponse({ status, cacheControl, setCookie, vary }) {
  if (status !== 200) {
    return { ok: false, reason: `expected HTTP 200, received ${status}` };
  }

  if (setCookie) {
    return { ok: false, reason: "response contains Set-Cookie" };
  }

  if (/(?:^|,)\s*\*(?:\s|,|$)/u.test(vary ?? "")) {
    return { ok: false, reason: "response Vary contains wildcard" };
  }

  if (/(?:^|,)\s*(?:private|no-cache|no-store)(?:\s|=|,|$)/iu.test(cacheControl ?? "")) {
    return { ok: false, reason: "response Cache-Control is not public-cache safe" };
  }

  return { ok: true };
}

function requiredValue(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}

function parseBaseUrl(env, name) {
  const value = requiredValue(env, name).trim();
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL`);
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error(
      `${name} must be an absolute HTTP(S) URL without credentials, query, or fragment`
    );
  }

  return url;
}

function parsePositiveInteger(value, name, fallback) {
  const source = value === undefined ? String(fallback) : value;
  if (typeof source !== "string" || !/^[1-9]\d*$/u.test(source)) {
    throw new Error(`${name} must be a positive integer`);
  }

  const parsed = Number(source);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${name} must be a safe positive integer`);
  }

  return parsed;
}

function parseDocsPaths(value) {
  const paths = (value === undefined ? DEFAULT_DOCS_PATHS : value.split(","))
    .map((path) => path.trim())
    .filter(Boolean);

  if (paths.length === 0) {
    throw new Error("DOCS_PATHS must include /docs and at least one nested /docs path");
  }

  const uniquePaths = [...new Set(paths)];
  for (const path of uniquePaths) {
    const normalizedPath = new URL(path, "http://cache-verifier.invalid").pathname;
    if (
      (path !== "/docs" && !path.startsWith("/docs/")) ||
      path.includes("?") ||
      path.includes("#") ||
      normalizedPath !== path
    ) {
      throw new Error("DOCS_PATHS entries must be canonical /docs paths without query or fragment");
    }
  }

  if (!uniquePaths.includes("/docs") || !uniquePaths.some((path) => /^\/docs\/.+/u.test(path))) {
    throw new Error("DOCS_PATHS must include /docs and at least one nested /docs path");
  }

  return uniquePaths;
}

function parseSensitiveValues(authCookie) {
  const values = [authCookie];

  for (const cookie of authCookie.split(";")) {
    const separator = cookie.indexOf("=");
    if (separator === -1) continue;

    const value = cookie
      .slice(separator + 1)
      .trim()
      .replace(/^"|"$/gu, "");
    if (!value) continue;

    values.push(value);
    try {
      values.push(decodeURIComponent(value));
    } catch {
      // The literal cookie value is still sensitive when percent-decoding fails.
    }
  }

  return [...new Set(values.filter(Boolean))].sort((left, right) => right.length - left.length);
}

/**
 * @param {Record<string, string | undefined>} [env]
 */
export function parseVerifierConfig(env = process.env) {
  const originBaseUrl = parseBaseUrl(env, "ORIGIN_BASE_URL");
  const edgeBaseUrl = parseBaseUrl(env, "EDGE_BASE_URL");
  const authCookie = requiredValue(env, "AUTH_COOKIE");
  const edgeReplicaCount = parsePositiveInteger(
    env.EDGE_REPLICA_COUNT,
    "EDGE_REPLICA_COUNT",
    DEFAULT_EDGE_REPLICA_COUNT
  );
  const maxEdgeRequests = parsePositiveInteger(
    env.MAX_EDGE_REQUESTS,
    "MAX_EDGE_REQUESTS",
    DEFAULT_MAX_EDGE_REQUESTS
  );

  if (maxEdgeRequests < edgeReplicaCount) {
    throw new Error("MAX_EDGE_REQUESTS must be at least EDGE_REPLICA_COUNT");
  }

  return {
    originBaseUrl,
    edgeBaseUrl,
    authCookie,
    authCookieValues: parseSensitiveValues(authCookie),
    docsPaths: parseDocsPaths(env.DOCS_PATHS),
    edgeReplicaCount,
    maxEdgeRequests,
  };
}

export function redactError(error, secret) {
  const message = error instanceof Error ? error.message : String(error);
  return parseSensitiveValues(secret ?? "").reduce(
    (redacted, value) => redacted.split(value).join("[REDACTED]"),
    message
  );
}

function requestUrl(baseUrl, path, query = "") {
  const url = new URL(path, baseUrl);
  if (query) {
    url.search = query;
  }
  return url;
}

async function fetchResponse(fetchImpl, url, options, secret) {
  let response;
  try {
    response = await fetchImpl(url, { redirect: "manual", ...options });
  } catch (error) {
    throw new Error(`request failed for ${url.pathname}: ${redactError(error, secret)}`);
  }

  let body;
  try {
    body = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new Error(`response body read failed for ${url.pathname}: ${redactError(error, secret)}`);
  }

  return {
    body,
    cacheControl: response.headers.get("cache-control"),
    edgeCache: response.headers.get("x-edge-cache"),
    edgeReplica: response.headers.get("x-edge-replica"),
    setCookie: response.headers.get("set-cookie"),
    status: response.status,
    vary: response.headers.get("vary"),
  };
}

function assertPublicResponse(response, label) {
  const classification = classifyPublicResponse(response);
  if (!classification.ok) {
    throw new Error(`${label}: ${classification.reason}`);
  }
}

function assertSameBody(expected, actual, label) {
  if (!expected.body.equals(actual.body) || expected.hash !== sha256(actual.body)) {
    throw new Error(`${label}: response bytes differ from the guest origin response`);
  }
}

function requestOptions(headers = {}, method = "GET") {
  return { headers, method };
}

async function verifyOriginPath(config, fetchImpl, path) {
  const variants = [
    { name: "guest", options: requestOptions() },
    { name: "sidebar-true", options: requestOptions({ Cookie: "sidebar_state=true" }) },
    { name: "sidebar-false", options: requestOptions({ Cookie: "sidebar_state=false" }) },
    { name: "sidebar-malformed", options: requestOptions({ Cookie: "sidebar_state=%E0%A4%A" }) },
    { name: "authenticated", options: requestOptions({ Cookie: config.authCookie }) },
  ];

  let guest;
  for (const variant of variants) {
    const response = await fetchResponse(
      fetchImpl,
      requestUrl(config.originBaseUrl, path, variant.query),
      variant.options,
      config.authCookie
    );
    assertPublicResponse(response, `origin ${path} ${variant.name}`);

    const digest = sha256(response.body);
    if (config.authCookieValues.some((value) => response.body.includes(Buffer.from(value)))) {
      throw new Error(
        `origin ${path} ${variant.name}: response body contains configured auth cookie`
      );
    }

    if (!guest) {
      guest = { body: response.body, hash: digest };
    } else {
      assertSameBody(
        guest,
        { body: response.body, hash: digest },
        `origin ${path} ${variant.name}`
      );
    }
  }

  const queryResponse = await fetchResponse(
    fetchImpl,
    requestUrl(config.originBaseUrl, path, "cache-verifier=safe"),
    requestOptions(),
    config.authCookie
  );
  assertPublicResponse(queryResponse, `origin ${path} safe-query`);
  if (config.authCookieValues.some((value) => queryResponse.body.includes(Buffer.from(value)))) {
    throw new Error(`origin ${path} safe-query: response body contains configured auth cookie`);
  }

  return { bytes: guest.body.length, path, sha256: guest.hash };
}

async function requestEdge(config, fetchImpl, path, options = requestOptions(), query = "") {
  const response = await fetchResponse(
    fetchImpl,
    requestUrl(config.edgeBaseUrl, path, query),
    options,
    config.authCookie
  );

  if (
    !response.edgeReplica ||
    !/^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/u.test(response.edgeReplica) ||
    response.edgeReplica.length > 253 ||
    config.authCookieValues.some((value) => response.edgeReplica.includes(value))
  ) {
    throw new Error(`edge ${path}: X-Edge-Replica is missing or invalid`);
  }

  return response;
}

async function collectHitsForEveryReplica(
  config,
  fetchImpl,
  path,
  expected,
  options,
  query,
  requests
) {
  const visits = new Map();
  const hits = new Set();

  while (hits.size < config.edgeReplicaCount) {
    if (requests.count >= config.maxEdgeRequests) {
      throw new Error(
        `edge ${path}: observed ${hits.size}/${config.edgeReplicaCount} replicas with a warm HIT within MAX_EDGE_REQUESTS`
      );
    }

    const response = await requestEdge(config, fetchImpl, path, options, query);
    requests.count += 1;
    const seen = (visits.get(response.edgeReplica) ?? 0) + 1;
    visits.set(response.edgeReplica, seen);

    assertPublicResponse(response, `edge ${path}`);
    assertSameBody(expected, { body: response.body, hash: sha256(response.body) }, `edge ${path}`);

    if (seen >= 2 && response.edgeCache === "HIT") {
      hits.add(response.edgeReplica);
    }
  }

  return hits;
}

async function verifyVariantHitsOnWarmedReplicas(
  config,
  fetchImpl,
  path,
  expected,
  options,
  query,
  warmedReplicas,
  requests
) {
  const observed = new Set();

  while (observed.size < warmedReplicas.size) {
    if (requests.count >= config.maxEdgeRequests) {
      throw new Error(`edge ${path}: MAX_EDGE_REQUESTS exhausted while checking warmed variants`);
    }

    const response = await requestEdge(config, fetchImpl, path, options, query);
    requests.count += 1;
    assertPublicResponse(response, `edge ${path}`);
    assertSameBody(expected, { body: response.body, hash: sha256(response.body) }, `edge ${path}`);

    if (!warmedReplicas.has(response.edgeReplica)) {
      throw new Error(`edge ${path}: response came from an unexpected replica`);
    }

    if (!observed.has(response.edgeReplica)) {
      if (response.edgeCache !== "HIT") {
        throw new Error(
          `edge ${path}: expected X-Edge-Cache HIT on first response from a warmed replica`
        );
      }
      observed.add(response.edgeReplica);
    }
  }
}

async function verifyBypasses(config, fetchImpl, nestedPath, requests) {
  const probes = [
    { name: "api-health", path: "/api/health" },
    { name: "docs-og", path: "/docs/og/index" },
    { name: "rsc", path: nestedPath, headers: { RSC: "1" } },
    { name: "router-state", path: nestedPath, headers: { "Next-Router-State-Tree": "[]" } },
    { name: "router-prefetch", path: nestedPath, headers: { "Next-Router-Prefetch": "1" } },
    {
      name: "router-segment-prefetch",
      path: nestedPath,
      headers: { "Next-Router-Segment-Prefetch": nestedPath },
    },
    { name: "server-action", path: nestedPath, headers: { "Next-Action": "cache-verifier" } },
    {
      name: "authorization",
      path: nestedPath,
      headers: { Authorization: "Bearer cache-verifier" },
    },
    { name: "purpose-prefetch", path: nestedPath, headers: { Purpose: "prefetch" } },
    { name: "sec-purpose-prefetch", path: nestedPath, headers: { "Sec-Purpose": "prefetch" } },
    { name: "post", path: nestedPath, method: "POST" },
  ];

  for (const probe of probes) {
    if (requests.count >= config.maxEdgeRequests) {
      throw new Error("MAX_EDGE_REQUESTS exhausted before bypass probes completed");
    }

    const response = await requestEdge(
      config,
      fetchImpl,
      probe.path,
      requestOptions(probe.headers, probe.method),
      ""
    );
    requests.count += 1;
    if (response.edgeCache !== "BYPASS") {
      throw new Error(
        `edge bypass ${probe.name}: expected X-Edge-Cache BYPASS, received ${response.edgeCache ?? "missing"}`
      );
    }
  }

  return probes.length;
}

async function verifyQueryBypass(config, fetchImpl, path, requests) {
  if (requests.count >= config.maxEdgeRequests) {
    throw new Error("MAX_EDGE_REQUESTS exhausted before query bypass probe completed");
  }

  const response = await requestEdge(
    config,
    fetchImpl,
    path,
    requestOptions(),
    "cache-verifier=safe"
  );
  requests.count += 1;
  if (response.edgeCache !== "BYPASS") {
    throw new Error(
      `edge bypass docs-query: expected X-Edge-Cache BYPASS, received ${response.edgeCache ?? "missing"}`
    );
  }
}

export async function runVerification(config, fetchImpl = fetch) {
  const originDocuments = [];
  for (const path of config.docsPaths) {
    originDocuments.push(await verifyOriginPath(config, fetchImpl, path));
  }

  const requests = { count: 0 };
  const replicas = new Set();
  for (const document of originDocuments) {
    const expected = { body: Buffer.alloc(0), hash: document.sha256 };
    // Fetch the canonical guest body once more for byte-for-byte edge comparisons.
    const origin = await fetchResponse(
      fetchImpl,
      requestUrl(config.originBaseUrl, document.path),
      requestOptions(),
      config.authCookie
    );
    assertPublicResponse(origin, `origin ${document.path} guest confirmation`);
    expected.body = origin.body;
    assertSameBody(
      { body: origin.body, hash: document.sha256 },
      { body: origin.body, hash: sha256(origin.body) },
      `origin ${document.path}`
    );

    const warmHits = await collectHitsForEveryReplica(
      config,
      fetchImpl,
      document.path,
      expected,
      requestOptions(),
      "",
      requests
    );
    for (const replica of warmHits) replicas.add(replica);

    await verifyQueryBypass(config, fetchImpl, document.path, requests);
    await verifyVariantHitsOnWarmedReplicas(
      config,
      fetchImpl,
      document.path,
      expected,
      requestOptions({ Cookie: config.authCookie }),
      "",
      warmHits,
      requests
    );
  }

  const bypassCount =
    config.docsPaths.length +
    (await verifyBypasses(
      config,
      fetchImpl,
      config.docsPaths.find((path) => path !== "/docs"),
      requests
    ));

  return {
    ok: true,
    origin: {
      documents: originDocuments.map(({ bytes, sha256: hash }) => ({ bytes, sha256: hash })),
      pathCount: originDocuments.length,
    },
    edge: {
      bypassCount,
      observedReplicaIds: [...replicas].sort(),
      pathCount: originDocuments.length,
      replicaCount: replicas.size,
      replicaCountExpected: config.edgeReplicaCount,
      requestCount: requests.count,
    },
  };
}

async function main() {
  let secret = "";
  try {
    const config = parseVerifierConfig();
    secret = config.authCookie;
    process.stdout.write(`${JSON.stringify(await runVerification(config))}\n`);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ ok: false, error: redactError(error, secret) })}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
