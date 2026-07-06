import { IconChevronRight } from "@tabler/icons-react";
import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@lib/utils";
import {
  reportDocumentsSystemBrokenLink,
  resolveDocumentsSystemLink,
} from "@features/documents-system/documents-system-link-tools";
import type {
  DocumentsSystemLinkRenderContext,
  DocumentsSystemResolvedLink,
} from "@features/documents-system/documents-system-types";

export const DocumentLinkGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "my-8 grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2",
      "[&>*]:min-w-0",
      className
    )}
  >
    {children}
  </div>
);

export const DocumentLinkGroup = ({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) => (
  <section
    className={cn("border-border/80 bg-muted/45 rounded-lg border p-5 shadow-xs", className)}
  >
    <div className="flex flex-col gap-1.5">
      <h3 className="text-foreground m-0 text-xl leading-tight font-semibold">{title}</h3>
      {description && <p className="text-foreground/70 m-0 text-sm leading-6">{description}</p>}
    </div>
    <div className="mt-4 grid gap-2.5">{children}</div>
  </section>
);

const DOCUMENT_LINK_CARD_LAYOUT_CLASS =
  "flex min-w-0 items-start justify-between gap-3 rounded-md border px-4 py-3 shadow-xs text-sm no-underline";
const DOCUMENT_LINK_CARD_INTERACTIVE_CLASS = cn(
  "group border-border/80 bg-background transition-[border-color,background-color,box-shadow]",
  "hover:border-ring/45 hover:bg-card hover:shadow-sm",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:outline-none"
);
const DOCUMENT_LINK_CARD_DISABLED_CLASS =
  "cursor-not-allowed border-border/70 bg-muted/35 text-muted-foreground opacity-75";
const DOCUMENT_LINK_CARD_MARKER_CLASS =
  "inline-flex shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] leading-none font-medium text-muted-foreground";
const DOCUMENT_LINK_CARD_MARKER_LABELS: Record<
  Extract<DocumentsSystemResolvedLink["state"], "broken" | "unpublished">,
  string
> = {
  broken: "Ссылка сломана",
  unpublished: "Еще не готово",
};

type DocumentLinkCardState = Extract<
  DocumentsSystemResolvedLink["state"],
  "broken" | "unpublished"
>;

type DocumentLinkCardProps = {
  href: string;
  title: string;
  children?: ReactNode;
  className?: string;
  linkContext?: DocumentsSystemLinkRenderContext;
};

const DocumentLinkCardMarker = ({ state }: { state: DocumentLinkCardState }) => (
  <span className={DOCUMENT_LINK_CARD_MARKER_CLASS}>{DOCUMENT_LINK_CARD_MARKER_LABELS[state]}</span>
);

const DocumentLinkCardContent = ({
  title,
  children,
  state,
  disabled,
}: {
  title: string;
  children?: ReactNode;
  state?: DocumentLinkCardState;
  disabled?: boolean;
}) => (
  <>
    <span className="min-w-0">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "min-w-0 leading-5 font-semibold",
            disabled ? "text-foreground/70" : "text-foreground"
          )}
        >
          {title}
        </span>
        {state && <DocumentLinkCardMarker state={state} />}
      </span>
      {children && (
        <span
          className={cn(
            "mt-1.5 block text-[13px] leading-5",
            disabled ? "text-muted-foreground" : "text-foreground/70"
          )}
        >
          {children}
        </span>
      )}
    </span>
    <IconChevronRight
      className={cn(
        "mt-0.5 size-4 shrink-0 transition-transform",
        disabled
          ? "text-muted-foreground/70"
          : "text-foreground/55 group-hover:text-foreground group-hover:translate-x-0.5"
      )}
    />
  </>
);

const ClickableDocumentLinkCard = ({
  href,
  title,
  children,
  className,
  state,
}: Omit<DocumentLinkCardProps, "linkContext"> & {
  state?: Extract<DocumentLinkCardState, "unpublished">;
}) => (
  <Link
    href={href}
    className={cn(DOCUMENT_LINK_CARD_LAYOUT_CLASS, DOCUMENT_LINK_CARD_INTERACTIVE_CLASS, className)}
    data-docs-link-state={state}
  >
    <DocumentLinkCardContent title={title} state={state}>
      {children}
    </DocumentLinkCardContent>
  </Link>
);

const DisabledDocumentLinkCard = ({
  title,
  children,
  className,
  state,
}: Omit<DocumentLinkCardProps, "href" | "linkContext"> & {
  state: DocumentLinkCardState;
}) => (
  <span
    aria-disabled="true"
    className={cn(DOCUMENT_LINK_CARD_LAYOUT_CLASS, DOCUMENT_LINK_CARD_DISABLED_CLASS, className)}
    data-docs-link-state={state}
  >
    <DocumentLinkCardContent title={title} state={state} disabled>
      {children}
    </DocumentLinkCardContent>
  </span>
);

export const DocumentLinkCard = ({
  href,
  title,
  children,
  className,
  linkContext,
}: DocumentLinkCardProps) => {
  if (linkContext) {
    const resolved = resolveDocumentsSystemLink(href, linkContext.index);

    if (resolved.state === "unpublished") {
      if (linkContext.environment === "production") {
        return (
          <DisabledDocumentLinkCard title={title} className={className} state="unpublished">
            {children}
          </DisabledDocumentLinkCard>
        );
      }

      return (
        <ClickableDocumentLinkCard
          href={href}
          title={title}
          className={className}
          state="unpublished"
        >
          {children}
        </ClickableDocumentLinkCard>
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
        <DisabledDocumentLinkCard title={title} className={className} state="broken">
          {children}
        </DisabledDocumentLinkCard>
      );
    }
  }

  return (
    <ClickableDocumentLinkCard href={href} title={title} className={className}>
      {children}
    </ClickableDocumentLinkCard>
  );
};
