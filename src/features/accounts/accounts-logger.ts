import { loggerFactory } from "@lib/logger";

export const accountsLogger = loggerFactory.child({ module: "accounts" });
