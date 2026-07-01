/** @jest-environment node */

import { execFileSync } from "node:child_process";

const loadOrganizationAccess = () => {
  const script = `
const { createJiti } = require("jiti");
const jiti = createJiti(process.cwd() + "/");

(async () => {
  const { organizationAccessControl, organizationRoles } = await jiti.import(
    "./src/server/auth/organization-access.ts"
  );

  console.log(JSON.stringify({
    apiKeyStatements: organizationAccessControl.statements.apiKey,
    ownerCanManageApiKeys: organizationRoles.owner.authorize({
      apiKey: ["create", "read", "update", "delete"],
    }).success,
    adminCanManageApiKeys: organizationRoles.admin.authorize({
      apiKey: ["create", "read", "update", "delete"],
    }).success,
    memberCanCreateApiKeys: organizationRoles.member.authorize({
      apiKey: ["create"],
    }).success,
    memberCanReadAccessControl: organizationRoles.member.authorize({
      ac: ["read"],
    }).success,
  }));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
`;

  return JSON.parse(
    execFileSync(process.execPath, ["-e", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
  ) as {
    apiKeyStatements: string[];
    ownerCanManageApiKeys: boolean;
    adminCanManageApiKeys: boolean;
    memberCanCreateApiKeys: boolean;
    memberCanReadAccessControl: boolean;
  };
};

describe("organization access control", () => {
  it("uses Better Auth access control for API key management permissions", () => {
    const organizationAccess = loadOrganizationAccess();

    expect(organizationAccess.apiKeyStatements).toEqual(["create", "read", "update", "delete"]);
    expect(organizationAccess.ownerCanManageApiKeys).toBe(true);
    expect(organizationAccess.adminCanManageApiKeys).toBe(true);
    expect(organizationAccess.memberCanCreateApiKeys).toBe(false);
    expect(organizationAccess.memberCanReadAccessControl).toBe(true);
  });
});
