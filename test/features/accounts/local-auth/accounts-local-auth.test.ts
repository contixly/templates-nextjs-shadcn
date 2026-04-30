/** @jest-environment node */

import {
  LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN,
  buildLocalAutomationEmail,
  generateLocalAutomationCredentials,
  isLocalAutomationAuthEnabled,
  isLocalAutomationEmail,
} from "@features/accounts/accounts-local-auth";

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.LOCAL_AUTOMATION_AUTH_ENABLED;

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, "NODE_ENV", {
    value,
    configurable: true,
  });
};

describe("accounts local automation auth helper", () => {
  afterEach(() => {
    setNodeEnv(originalNodeEnv ?? "test");
    if (originalFlag === undefined) {
      delete process.env.LOCAL_AUTOMATION_AUTH_ENABLED;
    } else {
      process.env.LOCAL_AUTOMATION_AUTH_ENABLED = originalFlag;
    }
  });

  it("enables local automation auth only outside production with the explicit flag", () => {
    setNodeEnv("development");
    process.env.LOCAL_AUTOMATION_AUTH_ENABLED = "true";
    expect(isLocalAutomationAuthEnabled()).toBe(true);

    process.env.LOCAL_AUTOMATION_AUTH_ENABLED = "false";
    expect(isLocalAutomationAuthEnabled()).toBe(false);

    setNodeEnv("production");
    process.env.LOCAL_AUTOMATION_AUTH_ENABLED = "true";
    expect(isLocalAutomationAuthEnabled()).toBe(false);
  });

  it("accepts only generated automation email addresses", () => {
    expect(isLocalAutomationEmail("local-agent+abc123@local-agent.test")).toBe(true);
    expect(isLocalAutomationEmail("LOCAL-AGENT+ABC123@LOCAL-AGENT.TEST")).toBe(true);
    expect(isLocalAutomationEmail("person@example.com")).toBe(false);
    expect(isLocalAutomationEmail("local-agent@local-agent.test")).toBe(false);
    expect(isLocalAutomationEmail("other+abc123@local-agent.test")).toBe(false);
  });

  it("builds deterministic local automation emails from a seed", () => {
    expect(buildLocalAutomationEmail("Run 123")).toBe(
      `local-agent+run-123@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`
    );
  });

  it("trims trailing hyphens introduced by seed truncation", () => {
    expect(buildLocalAutomationEmail(`${"a".repeat(47)} b`)).toBe(
      `local-agent+${"a".repeat(47)}@${LOCAL_AUTOMATION_AUTH_EMAIL_DOMAIN}`
    );
  });

  it("generates valid credentials for Better Auth email/password sign-up", () => {
    const credentials = generateLocalAutomationCredentials();

    expect(credentials.name).toMatch(/^Local Automation /);
    expect(isLocalAutomationEmail(credentials.email)).toBe(true);
    expect(credentials.password).toHaveLength(38);
    expect(credentials.password.startsWith("local-")).toBe(true);
  });
});
