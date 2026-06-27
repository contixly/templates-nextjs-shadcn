import { loggerFactory } from "@lib/logger";

export const apiKeysLogger = loggerFactory.child({ module: "api-keys" });
