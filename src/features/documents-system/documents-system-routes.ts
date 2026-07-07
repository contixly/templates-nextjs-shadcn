import { Feature } from "@typings/pages";
import { buildFeature } from "@lib/pages";
import { FEATURE_DOCUMENTS_SYSTEM } from "@features/documents-system/documents-system-consts";

type DocumentsSystemPages = "home";

export type DocumentsSystemRoutes = Feature<DocumentsSystemPages> & {
  api: {
    search: (params?: { query?: Record<string, string | undefined> }) => string;
  };
};

export const DocumentsSystemRouteRoot = "/docs";
const DocumentsSystemApiRoot = "/api/v1/documents-system";

const documentsSystemPages = buildFeature<DocumentsSystemPages>(FEATURE_DOCUMENTS_SYSTEM, {
  pages: {
    home: {
      pathTemplate: DocumentsSystemRouteRoot,
    },
  },
});

const routes: DocumentsSystemRoutes = {
  ...documentsSystemPages,
  api: {
    search: (params) => {
      const query = new URLSearchParams();

      Object.entries(params?.query ?? {}).forEach(([key, value]) => {
        if (value !== undefined) {
          query.set(key, value);
        }
      });

      const queryString = query.toString();

      return queryString
        ? `${DocumentsSystemApiRoot}/search?${queryString}`
        : `${DocumentsSystemApiRoot}/search`;
    },
  },
};

export default routes;
