import { IconAlertTriangle, IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import React, { ComponentPropsWithoutRef, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { Badge } from "@components/ui/badge";
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from "@components/ui/tabs";
import { CopyButtonWithTooltip } from "@components/ui/custom/copy-button-with-tooltip";
import { cn } from "@lib/utils";
import {
  getDocumentHeadingText,
  slugifyDocumentHeading,
} from "@features/documents-system/documents-system-heading-tools";
import { getStaticImageSize } from "@features/documents-system/documents-system-images";
import {
  reportDocumentsSystemBrokenLink,
  resolveDocumentsSystemLink,
} from "@features/documents-system/documents-system-link-tools";
import type {
  DocumentsSystemLinkRenderContext,
  DocumentsSystemResolvedLink,
} from "@features/documents-system/documents-system-types";
import { DocumentLinkCard, DocumentLinkGrid, DocumentLinkGroup } from "./documents-link-grid";
import { DocumentsHeadingShareButton } from "./documents-heading-share-button";

const DOCUMENTS_INLINE_LINK_CLASS =
  "font-medium text-foreground underline underline-offset-4 hover:text-primary";
const DOCUMENTS_DISABLED_INLINE_LINK_CLASS = cn(
  DOCUMENTS_INLINE_LINK_CLASS,
  "cursor-not-allowed text-muted-foreground hover:text-muted-foreground"
);
const DOCUMENTS_LINK_MARKER_CLASS =
  "ml-1 inline-flex rounded border border-border bg-muted px-1 py-0.5 align-baseline text-[10px] leading-none font-medium text-muted-foreground no-underline";
const DOCUMENTS_LINK_MARKER_LABELS: Record<
  Extract<DocumentsSystemResolvedLink["state"], "broken" | "unpublished">,
  string
> = {
  broken: "Ссылка сломана",
  unpublished: "Еще не готово",
};

type DocumentsInlineLinkProps = ComponentPropsWithoutRef<"a"> & {
  linkContext?: DocumentsSystemLinkRenderContext;
};
type DisabledDocumentsInlineSpanProps = ComponentPropsWithoutRef<"span"> &
  Partial<
    Pick<
      ComponentPropsWithoutRef<"a">,
      | "download"
      | "href"
      | "hrefLang"
      | "media"
      | "ping"
      | "referrerPolicy"
      | "rel"
      | "target"
      | "type"
    >
  >;

const DocumentsLinkMarker = ({
  state,
}: {
  state: Extract<DocumentsSystemResolvedLink["state"], "broken" | "unpublished">;
}) => <span className={DOCUMENTS_LINK_MARKER_CLASS}>{DOCUMENTS_LINK_MARKER_LABELS[state]}</span>;

const DisabledDocumentsInlineLink = ({
  state,
  children,
  ...props
}: ComponentPropsWithoutRef<"a"> & {
  state: Extract<DocumentsSystemResolvedLink["state"], "broken" | "unpublished">;
}) => {
  const spanProps = { ...props } as DisabledDocumentsInlineSpanProps;
  const { className } = spanProps;

  delete spanProps.className;
  delete spanProps.download;
  delete spanProps.href;
  delete spanProps.hrefLang;
  delete spanProps.media;
  delete spanProps.ping;
  delete spanProps.referrerPolicy;
  delete spanProps.rel;
  delete spanProps.role;
  delete spanProps.target;
  delete spanProps.type;

  return (
    <span
      aria-disabled="true"
      className={cn(DOCUMENTS_DISABLED_INLINE_LINK_CLASS, className)}
      data-docs-link-state={state}
      {...spanProps}
    >
      {children}
      <DocumentsLinkMarker state={state} />
    </span>
  );
};

const ExternalLink = ({ href = "", children, linkContext, ...props }: DocumentsInlineLinkProps) => {
  const isFootnoteRef = "data-footnote-ref" in props;
  const isFootnoteBackref = "data-footnote-backref" in props;

  if (isFootnoteRef || isFootnoteBackref) {
    return (
      <a
        href={href}
        className={cn(
          "text-muted-foreground hover:text-foreground no-underline",
          isFootnoteBackref && "ml-1"
        )}
        {...props}
      >
        {children}
      </a>
    );
  }

  const isExternal = /^https?:\/\//.test(href);

  if (isExternal) {
    return (
      <a
        href={href}
        className={DOCUMENTS_INLINE_LINK_CLASS}
        rel="noreferrer"
        target="_blank"
        {...props}
      >
        {children}
      </a>
    );
  }

  if (linkContext) {
    const resolved = resolveDocumentsSystemLink(href, linkContext.index);

    if (resolved.state === "unpublished") {
      if (linkContext.environment === "production") {
        return (
          <DisabledDocumentsInlineLink href={href} state="unpublished" {...props}>
            {children}
          </DisabledDocumentsInlineLink>
        );
      }

      return (
        <Link
          href={href}
          className={DOCUMENTS_INLINE_LINK_CLASS}
          data-docs-link-state="unpublished"
          {...props}
        >
          {children}
          <DocumentsLinkMarker state="unpublished" />
        </Link>
      );
    }

    if (resolved.state === "broken") {
      reportDocumentsSystemBrokenLink(linkContext.source.sourcePath, resolved);

      if (linkContext.environment === "local") {
        throw new Error(
          `Documents system broken link: ${linkContext.source.sourcePath} -> ${resolved.href}`
        );
      }

      return (
        <DisabledDocumentsInlineLink href={href} state="broken" {...props}>
          {children}
        </DisabledDocumentsInlineLink>
      );
    }
  }

  return (
    <Link href={href} className={DOCUMENTS_INLINE_LINK_CLASS} {...props}>
      {children}
    </Link>
  );
};

type CalloutVariant = "default" | "info" | "success" | "warning" | "danger";

const CALLOUT_ICON: Record<CalloutVariant, typeof IconInfoCircle> = {
  default: IconInfoCircle,
  info: IconInfoCircle,
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  danger: IconInfoCircle,
};

const CALLOUT_CONTAINER: Record<CalloutVariant, string> = {
  default: "border-border bg-background",
  info: "border-violet-500/35 bg-violet-500/[0.06]",
  success: "border-emerald-500/35 bg-emerald-500/[0.06]",
  warning: "border-yellow-500/40 bg-yellow-500/[0.08]",
  danger: "border-destructive/35 bg-destructive/[0.07]",
};

const CALLOUT_ICON_COLOR: Record<CalloutVariant, string> = {
  default: "text-muted-foreground",
  info: "text-violet-500",
  success: "text-emerald-500",
  warning: "text-yellow-500",
  danger: "text-destructive",
};

const CALLOUT_CONTENT_CLASS = cn(
  "text-[13.5px] leading-relaxed text-foreground",
  "[&>*:first-child]:mt-0",
  "[&_p]:mt-2 [&_p]:leading-relaxed [&_p]:text-foreground",
  "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-primary"
);

export const Callout = ({
  title,
  children,
  variant = "default",
}: {
  title?: string;
  children: ReactNode;
  variant?: CalloutVariant;
}) => {
  const Icon = CALLOUT_ICON[variant];

  return (
    <div
      role="note"
      className={cn(
        "my-4 grid grid-cols-[auto_1fr] items-start gap-3 rounded-lg border px-4 py-3.5 text-sm",
        CALLOUT_CONTAINER[variant]
      )}
    >
      <Icon className={cn("mt-0.5 size-4.5 shrink-0", CALLOUT_ICON_COLOR[variant])} />
      <div className="flex flex-col gap-1">
        {title && <div className="text-foreground text-[13.5px] font-semibold">{title}</div>}
        <div className={CALLOUT_CONTENT_CLASS}>{children}</div>
      </div>
    </div>
  );
};

export const Steps = ({ children }: { children: ReactNode }) => (
  <div className="my-6 flex flex-col [counter-reset:step]">{children}</div>
);

export const Step = ({ title, children }: { title: string; children: ReactNode }) => (
  <div
    className={cn(
      "group/step relative pb-6 pl-12 [counter-increment:step] last:pb-0",
      "before:absolute before:top-1 before:left-0 before:grid before:size-7 before:place-items-center",
      "before:bg-background before:rounded-full before:border before:font-mono before:text-[12px]",
      "before:text-foreground before:font-semibold before:content-[counter(step)]",
      "after:bg-border after:absolute after:top-9 after:bottom-0 after:left-[13.5px] after:w-px",
      "last:after:hidden"
    )}
  >
    <p className="text-foreground text-sm font-semibold">{title}</p>
    <div className="text-muted-foreground mt-1 text-sm leading-relaxed">{children}</div>
  </div>
);

export const Files = ({ children }: { children: ReactNode }) => (
  <div className="bg-background my-4 rounded-lg border p-3 font-mono text-[13px]">{children}</div>
);

export const Folder = ({ name, children }: { name: string; children?: ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 py-1">
      <Badge variant="outline" className="px-1.5 py-0 text-[10px] tracking-wider uppercase">
        dir
      </Badge>
      <span>{name}/</span>
    </div>
    {children && <div className="ml-3 border-l border-dashed pl-4">{children}</div>}
  </div>
);

export const File = ({ name }: { name: string }) => (
  <div className="flex items-center gap-2 py-1">
    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tracking-wider uppercase">
      file
    </Badge>
    <span>{name}</span>
  </div>
);

type DocumentTabProps = {
  title: string;
  value: string;
  children: ReactNode;
};

const isDocumentTabElement = (child: ReactNode): child is React.ReactElement<DocumentTabProps> =>
  React.isValidElement<DocumentTabProps>(child) &&
  typeof child.props.title === "string" &&
  typeof child.props.value === "string";

export const Tab = ({ children }: DocumentTabProps) => <>{children}</>;

const TABS_CONTENT_CLASS = cn(
  "grid gap-4 text-sm leading-7 text-foreground",
  "[&>*:first-child]:mt-0",
  "[&_p]:mt-4 [&_p]:leading-7 [&_p]:text-foreground",
  "[&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:text-foreground [&_ul]:marker:text-muted-foreground",
  "[&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:text-foreground [&_ol]:marker:text-muted-foreground",
  "[&_li]:leading-7",
  "[&_blockquote]:border-l-2 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_td]:border [&_td]:px-3 [&_td]:py-2 [&_td]:text-muted-foreground",
  "[&_th]:border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium"
);

export const Tabs = ({
  defaultValue,
  children,
}: {
  defaultValue?: string;
  children: ReactNode;
}) => {
  const tabs = React.Children.toArray(children).filter(isDocumentTabElement);
  const activeValue = defaultValue ?? tabs[0]?.props.value;

  if (!activeValue) {
    return null;
  }

  return (
    <BaseTabs defaultValue={activeValue} className="my-6 gap-4">
      <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-md p-1 sm:w-fit">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.props.value} value={tab.props.value} className="shrink-0">
            {tab.props.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.props.value}
          value={tab.props.value}
          className="bg-muted/20 rounded-md border p-4"
        >
          <div className={TABS_CONTENT_CLASS}>{tab.props.children}</div>
        </TabsContent>
      ))}
    </BaseTabs>
  );
};

const REMOTE_IMAGE_FALLBACK_SIZE = { width: 1600, height: 900 };
const DOCUMENT_IMAGE_FULL_WIDTH_THRESHOLD = 1440;
const DOCUMENT_IMAGE_COMPACT_MAX_WIDTH = 896;
const DOCUMENT_IMAGE_COMPACT_MAX_HEIGHT = 760;

const getDocumentImageContainerMaxWidth = (width: number, height: number): number | undefined => {
  const widthLimit =
    width >= DOCUMENT_IMAGE_FULL_WIDTH_THRESHOLD
      ? undefined
      : Math.min(width, DOCUMENT_IMAGE_COMPACT_MAX_WIDTH);
  const heightLimit =
    height > DOCUMENT_IMAGE_COMPACT_MAX_HEIGHT
      ? Math.round((DOCUMENT_IMAGE_COMPACT_MAX_HEIGHT * width) / height)
      : undefined;

  if (widthLimit === undefined) {
    if (heightLimit === undefined || heightLimit >= DOCUMENT_IMAGE_FULL_WIDTH_THRESHOLD) {
      return undefined;
    }

    return heightLimit;
  }

  return heightLimit === undefined ? widthLimit : Math.min(widthLimit, heightLimit);
};

const DocumentImage = async ({
  src,
  alt = "",
  title,
}: {
  src?: string;
  alt?: string;
  title?: string;
}) => {
  if (!src) return null;

  const isLocal = src.startsWith("/");
  const { width, height } = isLocal ? await getStaticImageSize(src) : REMOTE_IMAGE_FALLBACK_SIZE;
  const containerMaxWidth = getDocumentImageContainerMaxWidth(width, height);

  return (
    <span
      className={cn("my-6 block", containerMaxWidth ? "mx-auto w-full" : "w-full")}
      style={containerMaxWidth ? { maxWidth: `${containerMaxWidth}px` } : undefined}
    >
      <Image
        src={src}
        alt={alt}
        title={title}
        width={width}
        height={height}
        sizes="(min-width: 1280px) 760px, 100vw"
        unoptimized={!isLocal}
        className="bg-background block h-auto w-full rounded-lg border"
      />
      {title && (
        <span className="text-muted-foreground mt-2 block text-center text-xs">{title}</span>
      )}
    </span>
  );
};

const getCodeBlockText = (children: ReactNode): string =>
  React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (React.isValidElement<{ children?: ReactNode }>(child)) {
        return getCodeBlockText(child.props.children);
      }

      return "";
    })
    .join(" ");

export const documentsMdxComponents = {
  h1: ({ children, ...props }) => (
    <h1 className="hidden" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, id, ...props }) => {
    const headingId = id ?? slugifyDocumentHeading(children);
    const isFootnoteLabel = id === "footnote-label";
    const label = getDocumentHeadingText(children) || headingId;

    return (
      <h2
        id={headingId}
        className={cn(
          "text-foreground scroll-m-20 font-semibold tracking-tight",
          isFootnoteLabel
            ? "text-muted-foreground mt-0 mb-2 text-[11px] tracking-wider uppercase"
            : "group border-muted-foreground/50 mt-10 flex items-center gap-3 border-b border-dashed pb-0 text-[22px] first:mt-0"
        )}
        {...props}
      >
        {isFootnoteLabel ? (
          "Сноски"
        ) : (
          <>
            <span className="min-w-0 flex-1">{children}</span>
            <DocumentsHeadingShareButton headingId={headingId} label={label} />
          </>
        )}
      </h2>
    );
  },
  h3: ({ children, id, ...props }) => {
    const headingId = id ?? slugifyDocumentHeading(children);

    return (
      <h3
        id={headingId}
        className="text-foreground mt-7 scroll-m-20 text-lg font-semibold tracking-tight"
        {...props}
      >
        {children}
      </h3>
    );
  },
  p: ({ children, ...props }) => (
    <p className="text-foreground mt-4 leading-7" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, className, ...props }) => {
    const isTaskList = typeof className === "string" && className.includes("contains-task-list");
    return (
      <ul
        className={cn(
          "text-foreground marker:text-muted-foreground mt-4 space-y-1.5",
          isTaskList ? "ml-0 list-none" : "ml-6 list-disc",
          className
        )}
        {...props}
      >
        {children}
      </ul>
    );
  },
  ol: ({ children, className, ...props }) => (
    <ol
      className={cn(
        "text-foreground marker:text-muted-foreground mt-4 ml-6 list-decimal space-y-1.5",
        className
      )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, className, ...props }) => {
    const isTaskListItem = typeof className === "string" && className.includes("task-list-item");
    return (
      <li
        className={cn("leading-7", isTaskListItem && "flex items-baseline gap-2", className)}
        {...props}
      >
        {children}
      </li>
    );
  },
  input: ({ className, type, ...props }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          className={cn(
            "relative size-3.5 shrink-0 translate-y-[3px] cursor-default appearance-none",
            "border-border bg-background rounded-[3px] border",
            "checked:border-foreground checked:bg-foreground",
            "checked:before:absolute checked:before:top-[1px] checked:before:left-[4px]",
            "checked:before:h-[7px] checked:before:w-[3px] checked:before:rotate-45",
            "checked:before:border-r-[1.5px] checked:before:border-b-[1.5px]",
            "checked:before:border-background checked:before:content-['']",
            "disabled:opacity-100",
            className
          )}
          {...props}
        />
      );
    }
    return <input type={type} className={className} {...props} />;
  },
  del: ({ children, ...props }) => (
    <del className="text-muted-foreground" {...props}>
      {children}
    </del>
  ),
  section: ({ children, className, ...props }) => {
    if ("data-footnotes" in props) {
      return (
        <section className={cn("mt-12 border-t pt-6 text-sm", className)} {...props}>
          {children}
        </section>
      );
    }
    return (
      <section className={className} {...props}>
        {children}
      </section>
    );
  },
  a: ExternalLink,
  blockquote: ({ children, ...props }) => (
    <blockquote className="text-muted-foreground mt-4 border-l-2 pl-4 italic" {...props}>
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border px-3 py-2 text-left font-medium" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="text-muted-foreground border px-3 py-2" {...props}>
      {children}
    </td>
  ),
  code: ({ children, className, ...props }) => {
    const isCodeBlock = typeof className === "string" && className.startsWith("language-");
    if (isCodeBlock) {
      return (
        <code className={cn("font-mono", className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn("bg-muted rounded px-1.5 py-0.5 font-mono text-sm", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, className, ...props }) => {
    const code = getCodeBlockText(children);

    return (
      <div className="bg-muted/40 my-4 overflow-hidden rounded-lg border">
        <div className="border-border bg-background/60 flex items-center justify-end border-b px-2 py-1">
          <CopyButtonWithTooltip variant="ghost" size="sm" content={code} />
        </div>
        <div className="overflow-x-auto px-6 py-4">
          <pre className={cn("font-mono text-[12.5px] leading-relaxed", className)} {...props}>
            {children}
          </pre>
        </div>
      </div>
    );
  },
  img: DocumentImage,
  Callout,
  Steps,
  Step,
  Files,
  Folder,
  File,
  Tabs,
  Tab,
  DocumentLinkGrid,
  DocumentLinkGroup,
  DocumentLinkCard,
} satisfies MDXComponents;

export const createDocumentsMdxComponents = (
  linkContext: DocumentsSystemLinkRenderContext
): MDXComponents => ({
  ...documentsMdxComponents,
  a: (props) => <ExternalLink {...props} linkContext={linkContext} />,
  DocumentLinkCard: (props) => <DocumentLinkCard {...props} linkContext={linkContext} />,
});
