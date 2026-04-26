import {
  WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY,
  evaluateWorkspaceEmailDomainEligibility,
  extractWorkspaceEmailDomain,
  getWorkspaceAllowedEmailDomains,
  mergeWorkspaceAllowedEmailDomainsMetadata,
  normalizeWorkspaceAllowedEmailDomain,
  normalizeWorkspaceAllowedEmailDomains,
} from "@features/workspaces/workspaces-domain-restrictions";

describe("workspace email-domain restrictions", () => {
  it("normalizes allowed domains by trimming, lowercasing, stripping one leading at-sign, and deduplicating", () => {
    expect(
      normalizeWorkspaceAllowedEmailDomains([
        " Example.COM ",
        "@example.com",
        "team.example.com",
        "TEAM.example.com",
      ])
    ).toEqual({
      domains: ["example.com", "team.example.com"],
      invalidDomains: [],
    });
  });

  it("extracts normalized email domains from the final at-sign", () => {
    expect(extractWorkspaceEmailDomain("User@Example.COM")).toBe("example.com");
    expect(extractWorkspaceEmailDomain("first@last@sub.example.com")).toBe("sub.example.com");
    expect(extractWorkspaceEmailDomain("not-an-email")).toBeNull();
  });

  it("matches exact domains only", () => {
    const metadata = mergeWorkspaceAllowedEmailDomainsMetadata(null, ["example.com"]);

    expect(evaluateWorkspaceEmailDomainEligibility(metadata, "alice@example.com")).toMatchObject({
      allowed: true,
      reason: "email-domain-allowed",
      emailDomain: "example.com",
    });
    expect(
      evaluateWorkspaceEmailDomainEligibility(metadata, "alice@sub.example.com")
    ).toMatchObject({
      allowed: false,
      reason: "email-domain-restricted",
      emailDomain: "sub.example.com",
    });
  });

  it("allows any email when restrictions are disabled", () => {
    expect(evaluateWorkspaceEmailDomainEligibility(null, "alice@outside.test")).toMatchObject({
      allowed: true,
      reason: "restrictions-disabled",
      allowedEmailDomains: [],
    });
    expect(
      evaluateWorkspaceEmailDomainEligibility(
        mergeWorkspaceAllowedEmailDomainsMetadata({ retained: true }, []),
        "not-an-email"
      )
    ).toMatchObject({
      allowed: true,
      reason: "restrictions-disabled",
    });
  });

  it("rejects invalid allowed-domain values", () => {
    expect(normalizeWorkspaceAllowedEmailDomain("@@example.com")).toBeNull();
    expect(normalizeWorkspaceAllowedEmailDomains(["example", "bad domain.test"])).toEqual({
      domains: [],
      invalidDomains: ["example", "bad domain.test"],
    });
    expect(() => mergeWorkspaceAllowedEmailDomainsMetadata(null, ["bad domain.test"])).toThrow(
      "Invalid allowed email domains"
    );
  });

  it("reads and writes only the allowed-domain metadata key", () => {
    const metadata = mergeWorkspaceAllowedEmailDomainsMetadata(
      {
        retained: true,
        [WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY]: ["old.example"],
      },
      ["Example.COM", "admin.example.com"]
    );

    expect(metadata).toEqual({
      retained: true,
      [WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY]: ["example.com", "admin.example.com"],
    });
    expect(getWorkspaceAllowedEmailDomains(metadata)).toEqual(["example.com", "admin.example.com"]);

    expect(mergeWorkspaceAllowedEmailDomainsMetadata(metadata, [])).toEqual({
      retained: true,
    });
  });

  it("reads allowed domains from raw serialized organization metadata", () => {
    expect(
      getWorkspaceAllowedEmailDomains(
        JSON.stringify({
          [WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY]: ["Example.COM"],
        })
      )
    ).toEqual(["example.com"]);
  });
});
