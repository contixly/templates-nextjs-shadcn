/** @jest-environment node */

import {
  classifyPublicResponse,
  parseVerifierConfig,
  redactError,
  sha256,
} from "../../scripts/test/verify-docs-public-cache.mjs";

describe("public documentation cache verifier", () => {
  test("exports deterministic safe helpers without executing the CLI on import", () => {
    expect(sha256(Buffer.from("docs"))).toMatch(/^[a-f0-9]{64}$/u);
    expect(
      classifyPublicResponse({
        status: 200,
        cacheControl: "public, s-maxage=3600",
        setCookie: null,
      })
    ).toEqual({ ok: true });
    expect(
      classifyPublicResponse({ status: 200, cacheControl: "private, no-store", setCookie: null })
    ).toMatchObject({ ok: false });
    expect(
      classifyPublicResponse({
        status: 200,
        cacheControl: 'public, private="Set-Cookie"',
        setCookie: null,
      })
    ).toMatchObject({ ok: false });
    expect(
      classifyPublicResponse({ status: 200, cacheControl: "public", setCookie: "session=x" })
    ).toMatchObject({ ok: false });
    expect(redactError(new Error("Cookie: super-secret"), "super-secret")).not.toContain(
      "super-secret"
    );
  });

  test("rejects invalid configuration before a fetch can be attempted", () => {
    expect(() =>
      parseVerifierConfig({
        ORIGIN_BASE_URL: "",
        EDGE_BASE_URL: "http://edge.test",
        AUTH_COOKIE: "session=secret",
      })
    ).toThrow("ORIGIN_BASE_URL");
    expect(() =>
      parseVerifierConfig({
        ORIGIN_BASE_URL: "http://origin.test",
        EDGE_BASE_URL: "http://edge.test",
        AUTH_COOKIE: "session=secret",
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
        AUTH_COOKIE: "session=secret",
        DOCS_PATHS: "/docs,/docs/../private",
      })
    ).toThrow("DOCS_PATHS");
  });
});
