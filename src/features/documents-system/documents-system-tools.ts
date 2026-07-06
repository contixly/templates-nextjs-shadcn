import {
  DocumentInfo,
  DocumentsSystemEnvironment,
  DocumentsSystemMetadata,
  DocumentsSystemNavigationItem,
  DocumentsSystemParentStatusMix,
  DocumentsSystemPageNavigation,
  DocumentsSystemSidebarGroup,
  DocumentsSystemStatus,
  DocumentsSystemStatusTone,
} from "./documents-system-types";
import { DocumentsSystemRouteRoot } from "./documents-system-routes";
import { parseDocumentsSystemContentPath } from "./documents-system-locale-tools";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const DOCUMENT_STATUS_VALUES: readonly DocumentsSystemStatus[] = [
  "draft",
  "review",
  "published",
  "archived",
];

const isDocumentStatus = (value: unknown): value is DocumentsSystemStatus =>
  typeof value === "string" && DOCUMENT_STATUS_VALUES.includes(value as DocumentsSystemStatus);

const validateOptionalString = (value: unknown): { ok: true; value?: string } | { ok: false } => {
  if (value === undefined || value === null) return { ok: true };
  return isNonEmptyString(value) ? { ok: true, value } : { ok: false };
};

const validateOptionalNumber = (value: unknown): { ok: true; value?: number } | { ok: false } => {
  if (value === undefined || value === null) return { ok: true };
  return isFiniteNumber(value) ? { ok: true, value } : { ok: false };
};

const validateRequiredStatus = (
  value: unknown
): { ok: true; value: DocumentsSystemStatus } | { ok: false } => {
  return isDocumentStatus(value) ? { ok: true, value } : { ok: false };
};

const validateOptionalBoolean = (value: unknown): { ok: true; value?: boolean } | { ok: false } => {
  if (value === undefined || value === null) return { ok: true };
  return isBoolean(value) ? { ok: true, value } : { ok: false };
};

const groupBy = <TItem, TKey>(
  items: TItem[],
  getKey: (item: TItem) => TKey
): Map<TKey, TItem[]> => {
  const groups = new Map<TKey, TItem[]>();

  items.forEach((item) => {
    const key = getKey(item);
    const group = groups.get(key);

    if (group) {
      group.push(item);
      return;
    }

    groups.set(key, [item]);
  });

  return groups;
};

const maxOrder = (orders: Array<number | undefined>) =>
  orders.reduce<number | undefined>((max, order) => {
    if (order === undefined) return max;
    return max === undefined || order > max ? order : max;
  }, undefined);

const documentUrlToHref = (url: string) =>
  url === "index" ? DocumentsSystemRouteRoot : `${DocumentsSystemRouteRoot}/${url}`;

const toNavigationItem = (document: DocumentInfo): DocumentsSystemNavigationItem => ({
  href: documentUrlToHref(document.url),
  title: document.meta.title,
  description: document.meta.description,
});

export const documentsSystemTools = {
  normalizeDocumentUrl: (filePath: string) =>
    parseDocumentsSystemContentPath(filePath).canonicalUrl,

  documentUrlToSlug: (url: string) => (url === "index" ? [] : url.split("/").filter(Boolean)),

  documentUrlToHref,

  validateMetadata: (data: Record<string, unknown>): DocumentsSystemMetadata | undefined => {
    if (
      !isNonEmptyString(data.title) ||
      !isNonEmptyString(data.description) ||
      !isNonEmptyString(data.group) ||
      !isNonEmptyString(data.parentItem) ||
      !isFiniteNumber(data.order) ||
      !isDocumentStatus(data.status) ||
      !isBoolean(data.toc)
    ) {
      return undefined;
    }

    const purpose = validateOptionalString(data.purpose);
    const groupOrder = validateOptionalNumber(data.groupOrder);
    const parentItemOrder = validateOptionalNumber(data.parentItemOrder);
    const author = validateOptionalString(data.author);
    const version = validateOptionalString(data.version);
    const status = validateRequiredStatus(data.status);
    const hide = validateOptionalBoolean(data.hide);
    const editedAt = validateOptionalString(data.editedAt);
    const reading = validateOptionalString(data.reading);
    const source = validateOptionalString(data.source);

    if (
      !purpose.ok ||
      !groupOrder.ok ||
      !parentItemOrder.ok ||
      !author.ok ||
      !version.ok ||
      !status.ok ||
      !hide.ok ||
      !editedAt.ok ||
      !reading.ok ||
      !source.ok
    ) {
      return undefined;
    }

    return {
      title: data.title,
      description: data.description,
      group: data.group,
      ...(groupOrder.value !== undefined ? { groupOrder: groupOrder.value } : {}),
      parentItem: data.parentItem,
      ...(parentItemOrder.value !== undefined ? { parentItemOrder: parentItemOrder.value } : {}),
      order: data.order,
      status: status.value,
      ...(hide.value !== undefined ? { hide: hide.value } : {}),
      toc: data.toc,
      ...(purpose.value !== undefined ? { purpose: purpose.value } : {}),
      ...(author.value !== undefined ? { author: author.value } : {}),
      ...(version.value !== undefined ? { version: version.value } : {}),
      ...(editedAt.value !== undefined ? { editedAt: editedAt.value } : {}),
      ...(reading.value !== undefined ? { reading: reading.value } : {}),
      ...(source.value !== undefined ? { source: source.value } : {}),
    };
  },

  getDocumentStatusTone: (
    meta: DocumentsSystemMetadata,
    environment: DocumentsSystemEnvironment
  ): DocumentsSystemStatusTone => {
    if (environment === "production") {
      return meta.status === "archived" ? "archived" : "default";
    }

    return meta.status === "published" ? "default" : meta.status;
  },

  isDocumentHiddenInProduction: (
    meta: DocumentsSystemMetadata,
    environment: DocumentsSystemEnvironment
  ) => environment !== "production" && meta.hide === true,

  composeParentStatusMix: (
    documents: DocumentInfo[],
    environment: DocumentsSystemEnvironment
  ): DocumentsSystemParentStatusMix => {
    if (environment === "production") {
      return "default";
    }

    const hasDraft = documents.some((document) => document.meta.status === "draft");
    const hasReview = documents.some((document) => document.meta.status === "review");

    if (hasDraft && hasReview) return "draft-review";
    if (hasDraft) return "draft";
    if (hasReview) return "review";
    return "default";
  },

  isDocumentVisible: (meta: DocumentsSystemMetadata, environment: DocumentsSystemEnvironment) => {
    if (environment !== "production") {
      return true;
    }

    return meta.hide !== true && (meta.status === "published" || meta.status === "archived");
  },

  sortDocuments: <TDocument extends { meta: DocumentsSystemMetadata }>(documents: TDocument[]) => {
    const groupOrders = new Map<string, number | undefined>();
    const parentItemOrders = new Map<string, number | undefined>();

    documents.forEach((document) => {
      const parentKey = `${document.meta.group}\u0000${document.meta.parentItem}`;

      groupOrders.set(
        document.meta.group,
        maxOrder([groupOrders.get(document.meta.group), document.meta.groupOrder])
      );
      parentItemOrders.set(
        parentKey,
        maxOrder([parentItemOrders.get(parentKey), document.meta.parentItemOrder])
      );
    });

    return [...documents].sort((a, b) => {
      const groupOrderCompare =
        (groupOrders.get(b.meta.group) ?? 0) - (groupOrders.get(a.meta.group) ?? 0);
      if (groupOrderCompare !== 0) return groupOrderCompare;

      const groupCompare = a.meta.group.localeCompare(b.meta.group);
      if (groupCompare !== 0) return groupCompare;

      const aParentKey = `${a.meta.group}\u0000${a.meta.parentItem}`;
      const bParentKey = `${b.meta.group}\u0000${b.meta.parentItem}`;
      const parentItemOrderCompare =
        (parentItemOrders.get(bParentKey) ?? 0) - (parentItemOrders.get(aParentKey) ?? 0);
      if (parentItemOrderCompare !== 0) return parentItemOrderCompare;

      const parentCompare = a.meta.parentItem.localeCompare(b.meta.parentItem);
      if (parentCompare !== 0) return parentCompare;

      const orderCompare = b.meta.order - a.meta.order;
      if (orderCompare !== 0) return orderCompare;

      return a.meta.title.localeCompare(b.meta.title);
    });
  },

  findDocument: (documents: DocumentInfo[], currentPath: string) =>
    documents.find((document) => document.url === currentPath),

  findPrevNextDocument: (documents: DocumentInfo[], currentPath: string) => {
    const index = documents.findIndex((document) => document.url === currentPath);

    if (index === -1) {
      return { prev: undefined, next: undefined };
    }

    return {
      prev: index > 0 ? documents[index - 1] : undefined,
      next: index < documents.length - 1 ? documents[index + 1] : undefined,
    };
  },

  buildStaticParams: (documents: DocumentInfo[]) =>
    documents
      .filter((document) => document.url !== "index")
      .map((document) => {
        if (document.slug.some((segment) => /\.(en|ru)$/iu.test(segment))) {
          throw new Error(
            `Documents-system static params must use canonical slugs without locale suffixes: ${document.slug.join("/")}`
          );
        }

        return { slug: document.slug };
      }),

  buildPageNavigation: (
    documents: DocumentInfo[],
    currentPath: string
  ): DocumentsSystemPageNavigation => {
    const { prev, next } = documentsSystemTools.findPrevNextDocument(documents, currentPath);

    return {
      prev: prev ? toNavigationItem(prev) : undefined,
      next: next ? toNavigationItem(next) : undefined,
    };
  },

  buildSidebarMenuItems: (
    documents: DocumentInfo[],
    environment: DocumentsSystemEnvironment
  ): DocumentsSystemSidebarGroup[] => {
    const result: DocumentsSystemSidebarGroup[] = [];
    const groups = groupBy(documents, (document) => document.meta.group);

    groups?.forEach((groupDocuments, groupName) => {
      const parents = groupBy(groupDocuments, (document) => document.meta.parentItem);
      const groupItems: DocumentsSystemSidebarGroup["items"] = [];

      parents?.forEach((parentDocuments, parentName) => {
        groupItems.push({
          label: parentName,
          statusMix: documentsSystemTools.composeParentStatusMix(parentDocuments, environment),
          items: parentDocuments.map((document) => {
            return {
              label: document.meta.title,
              href: documentUrlToHref(document.url),
              statusTone: documentsSystemTools.getDocumentStatusTone(document.meta, environment),
              hiddenInProduction: documentsSystemTools.isDocumentHiddenInProduction(
                document.meta,
                environment
              ),
            };
          }),
        });
      });

      result.push({
        label: groupName,
        items: groupItems,
      });
    });

    return result;
  },
};
