export const WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY = "allowedEmailDomains";

export type WorkspaceEmailDomainRestrictionReason =
  | "restrictions-disabled"
  | "email-domain-allowed"
  | "email-domain-restricted"
  | "invalid-email-domain";

export interface WorkspaceAllowedEmailDomainsNormalization {
  domains: string[];
  invalidDomains: string[];
}

export interface WorkspaceEmailDomainEligibility {
  allowed: boolean;
  reason: WorkspaceEmailDomainRestrictionReason;
  emailDomain: string | null;
  allowedEmailDomains: string[];
}

type WorkspaceMetadataInput = Record<string, unknown> | string | null | undefined;

const domainPattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const toMetadataRecord = (metadata: WorkspaceMetadataInput): Record<string, unknown> => {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === "string") {
    try {
      const parsedMetadata = JSON.parse(metadata) as unknown;

      return parsedMetadata && typeof parsedMetadata === "object" && !Array.isArray(parsedMetadata)
        ? (parsedMetadata as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return !Array.isArray(metadata) ? metadata : {};
};

export const normalizeWorkspaceAllowedEmailDomain = (value: string) => {
  const trimmedValue = value.trim().toLowerCase();
  const normalizedValue = trimmedValue.startsWith("@") ? trimmedValue.slice(1) : trimmedValue;

  if (!domainPattern.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
};

export const normalizeWorkspaceAllowedEmailDomains = (
  values: readonly string[]
): WorkspaceAllowedEmailDomainsNormalization => {
  const domains: string[] = [];
  const seenDomains = new Set<string>();
  const invalidDomains: string[] = [];

  for (const value of values) {
    const normalizedDomain = normalizeWorkspaceAllowedEmailDomain(value);

    if (!normalizedDomain) {
      invalidDomains.push(value);
      continue;
    }

    if (!seenDomains.has(normalizedDomain)) {
      seenDomains.add(normalizedDomain);
      domains.push(normalizedDomain);
    }
  }

  return {
    domains,
    invalidDomains,
  };
};

export const getWorkspaceAllowedEmailDomains = (metadata: WorkspaceMetadataInput) => {
  const value = toMetadataRecord(metadata)[WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY];

  if (!Array.isArray(value)) {
    return [];
  }

  return normalizeWorkspaceAllowedEmailDomains(
    value.filter((item): item is string => typeof item === "string")
  ).domains;
};

export const mergeWorkspaceAllowedEmailDomainsMetadata = (
  metadata: WorkspaceMetadataInput,
  allowedEmailDomains: readonly string[]
) => {
  const normalization = normalizeWorkspaceAllowedEmailDomains(allowedEmailDomains);

  if (normalization.invalidDomains.length > 0) {
    throw new Error(`Invalid allowed email domains: ${normalization.invalidDomains.join(", ")}`);
  }

  const nextMetadata = {
    ...toMetadataRecord(metadata),
  };

  if (normalization.domains.length === 0) {
    delete nextMetadata[WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY];
  } else {
    nextMetadata[WORKSPACE_ALLOWED_EMAIL_DOMAINS_METADATA_KEY] = normalization.domains;
  }

  return nextMetadata;
};

export const extractWorkspaceEmailDomain = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex < 1 || atIndex === normalizedEmail.length - 1) {
    return null;
  }

  return normalizeWorkspaceAllowedEmailDomain(normalizedEmail.slice(atIndex + 1));
};

export const evaluateWorkspaceEmailDomainEligibility = (
  metadata: WorkspaceMetadataInput,
  email: string
): WorkspaceEmailDomainEligibility => {
  const allowedEmailDomains = getWorkspaceAllowedEmailDomains(metadata);
  const emailDomain = extractWorkspaceEmailDomain(email);

  if (allowedEmailDomains.length === 0) {
    return {
      allowed: true,
      reason: "restrictions-disabled",
      emailDomain,
      allowedEmailDomains,
    };
  }

  if (!emailDomain) {
    return {
      allowed: false,
      reason: "invalid-email-domain",
      emailDomain,
      allowedEmailDomains,
    };
  }

  const allowed = allowedEmailDomains.includes(emailDomain);

  return {
    allowed,
    reason: allowed ? "email-domain-allowed" : "email-domain-restricted",
    emailDomain,
    allowedEmailDomains,
  };
};
