import { ComponentType } from "react";
import { Metadata } from "next";
import type { MDXProps } from "mdx/types";
import type { AppLocale } from "@/src/i18n/config";

export type DocumentsSystemStatus = "draft" | "review" | "published" | "archived";
export type DocumentsSystemStatusTone = "default" | "draft" | "review" | "archived";
export type DocumentsSystemParentStatusMix = "default" | "draft" | "review" | "draft-review";

export interface DocumentsSystemMetadata extends Metadata {
  title: string;
  description: string;
  group: string;
  groupOrder?: number;
  parentItem: string;
  parentItemOrder?: number;
  order: number;
  status: DocumentsSystemStatus;
  hide?: boolean;
  toc: boolean;
  purpose?: string;
  author?: string;
  version?: string;
  editedAt?: string;
  reading?: string;
  source?: string;
}

export type DocumentsSystemEnvironment = "local" | "production";

export const CACHE_DocumentsSystemTag = (id: string) => `documents_system_${id}`;

export type DocumentsSystemContentLocale = AppLocale;

export type DocumentsSystemParsedContentPath = {
  sourcePath: string;
  canonicalSourcePath: string;
  canonicalUrl: string;
  contentLocale: DocumentsSystemContentLocale;
  explicitLocale?: DocumentsSystemContentLocale;
  hasExplicitLocale: boolean;
};

export type DocumentsSystemDocumentVariant = {
  url: string;
  slug: string[];
  sourcePath: string;
  canonicalSourcePath: string;
  contentLocale: DocumentsSystemContentLocale;
  hasExplicitLocale: boolean;
  meta: DocumentsSystemMetadata;
};

export type DocumentInfo = {
  url: string;
  slug: string[];
  sourcePath: string;
  canonicalSourcePath: string;
  requestedLocale: AppLocale;
  contentLocale: DocumentsSystemContentLocale;
  isLocaleFallback: boolean;
  availableLocales: DocumentsSystemContentLocale[];
  meta: DocumentsSystemMetadata;
};

export type DocumentModule = {
  default: ComponentType<MDXProps>;
};

export type DocumentsSystemLinkState = "valid" | "unpublished" | "broken" | "external" | "ignored";

export type DocumentsSystemLinkIndex = {
  allByUrl: Map<string, DocumentInfo>;
  productionVisibleByUrl: Map<string, DocumentInfo>;
};

export type DocumentsSystemResolvedLink =
  | {
      state: "valid" | "unpublished";
      href: string;
      targetUrl: string;
      target: DocumentInfo;
    }
  | {
      state: "broken";
      href: string;
      targetUrl: string;
    }
  | {
      state: "external" | "ignored";
      href: string;
    };

export type DocumentsSystemExtractedLink = {
  sourcePath: string;
  href: string;
  line: number;
};

export type DocumentsSystemBrokenLink = DocumentsSystemExtractedLink & {
  targetUrl: string;
};

export type DocumentsSystemLinkRenderContext = {
  source: DocumentInfo;
  index: DocumentsSystemLinkIndex;
  environment: DocumentsSystemEnvironment;
};

export type DocumentsSystemNavigationItem = {
  href: string;
  title: string;
  description: string;
};

export type DocumentsSystemPageNavigation = {
  prev?: DocumentsSystemNavigationItem;
  next?: DocumentsSystemNavigationItem;
};

export type DocumentsSystemSidebarLink = {
  label: string;
  href: string;
  statusTone: DocumentsSystemStatusTone;
  hiddenInProduction: boolean;
};

export type DocumentsSystemSidebarParent = {
  label: string;
  statusMix: DocumentsSystemParentStatusMix;
  items: DocumentsSystemSidebarLink[];
};

export type DocumentsSystemSidebarGroup = {
  label: string;
  items: DocumentsSystemSidebarParent[];
};
