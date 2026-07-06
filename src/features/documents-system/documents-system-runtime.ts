import type { DocumentsSystemEnvironment } from "./documents-system-types";

export const getDocumentsSystemEnvironment = (): DocumentsSystemEnvironment => {
  if (process.env.DOCUMENTS_SYSTEM_ENV === "production") {
    return "production";
  }

  if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
    return "production";
  }

  return "local";
};
