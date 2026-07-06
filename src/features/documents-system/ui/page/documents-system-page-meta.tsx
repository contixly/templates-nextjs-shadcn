import {
  IconClock,
  IconEdit,
  IconEyeOff,
  IconFolder,
  IconGitBranch,
  IconTarget,
  IconUser,
} from "@tabler/icons-react";
import React, { CSSProperties, ReactNode } from "react";
import { cn } from "@lib/utils";
import {
  DocumentsSystemMetadata,
  DocumentsSystemStatus,
  DocumentsSystemStatusTone,
} from "@features/documents-system/documents-system-types";

const STATUS_LABEL: Record<DocumentsSystemStatus, string> = {
  draft: "Черновик",
  review: "На проверке",
  published: "Опубликовано",
  archived: "В архиве",
};

const STATUS_DOT_CLASS: Record<DocumentsSystemStatus, string> = {
  draft: "bg-amber-500",
  review: "bg-sky-500",
  published: "bg-emerald-500",
  archived: "bg-muted-foreground/40",
};

const META_DEFAULT_TONE_CLASS = "border bg-border border-muted-foreground/50";
const META_DEFAULT_CELL_TONE_CLASS = "bg-muted/40";

const META_TONE_CLASS: Record<DocumentsSystemStatusTone, string> = {
  default: META_DEFAULT_TONE_CLASS,
  draft: META_DEFAULT_TONE_CLASS,
  review: META_DEFAULT_TONE_CLASS,
  archived: "border-muted-foreground/25 bg-muted-foreground/20",
};

const META_CELL_TONE_CLASS: Record<DocumentsSystemStatusTone, string> = {
  default: META_DEFAULT_CELL_TONE_CLASS,
  draft: META_DEFAULT_CELL_TONE_CLASS,
  review: META_DEFAULT_CELL_TONE_CLASS,
  archived: "bg-muted/60",
};

const formatEditedAt = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const META_CELL_CLASS = "flex min-w-0 flex-col gap-1 px-4 py-3";

const MetaItem = ({
  icon,
  label,
  children,
  className,
  tone = "default",
  valueClassName,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
  tone?: DocumentsSystemStatusTone;
  valueClassName?: string;
}) => (
  <div className={cn(META_CELL_CLASS, META_CELL_TONE_CLASS[tone], className)}>
    <span className="text-muted-foreground text-[10.5px] font-medium tracking-[0.06em] uppercase">
      {label}
    </span>
    <span className="text-foreground flex min-w-0 items-center gap-1.5 text-[13px] font-medium">
      <span className="text-muted-foreground flex size-3.5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className={cn(valueClassName ?? "truncate")}>{children}</span>
    </span>
  </div>
);

export const DocumentsSystemPageMeta = ({
  meta,
  statusTone,
  hiddenInProduction = false,
}: {
  meta: DocumentsSystemMetadata;
  statusTone: DocumentsSystemStatusTone;
  hiddenInProduction?: boolean;
}) => {
  const status = meta.status;
  const showStatus = statusTone !== "default";

  const secondaryMetaItems: ReactNode[] = [];

  if (meta.editedAt) {
    secondaryMetaItems.push(
      <MetaItem key="edited-at" icon={<IconEdit size={14} />} label="Изменено" tone={statusTone}>
        {formatEditedAt(meta.editedAt)}
      </MetaItem>
    );
  }

  if (meta.author) {
    secondaryMetaItems.push(
      <MetaItem key="author" icon={<IconUser size={14} />} label="Автор" tone={statusTone}>
        {meta.author}
      </MetaItem>
    );
  }

  if (meta.version) {
    secondaryMetaItems.push(
      <MetaItem key="version" icon={<IconGitBranch size={14} />} label="Версия" tone={statusTone}>
        <span className="font-mono">v{meta.version}</span>
      </MetaItem>
    );
  }

  if (meta.reading) {
    secondaryMetaItems.push(
      <MetaItem key="reading" icon={<IconClock size={14} />} label="Время чтения" tone={statusTone}>
        {meta.reading}
      </MetaItem>
    );
  }

  if (showStatus) {
    secondaryMetaItems.push(
      <div key="status" className={cn(META_CELL_CLASS, META_CELL_TONE_CLASS[statusTone])}>
        <span className="text-muted-foreground text-[10.5px] font-medium tracking-[0.06em] uppercase">
          Статус
        </span>
        <span className="bg-background text-foreground inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase">
          <span className={cn("size-1.5 rounded-full", STATUS_DOT_CLASS[status])} />
          {STATUS_LABEL[status]}
        </span>
      </div>
    );
  }

  if (hiddenInProduction) {
    secondaryMetaItems.push(
      <MetaItem
        key="hidden-in-production"
        icon={<IconEyeOff size={14} />}
        label="Видимость"
        tone={statusTone}
        valueClassName="whitespace-normal break-words"
      >
        Скрыто в prod
      </MetaItem>
    );
  }

  return (
    <div
      className={cn("mt-5 overflow-hidden rounded-sm shadow-xs", META_TONE_CLASS[statusTone])}
      data-status-tone={statusTone}
      data-hidden-in-production={hiddenInProduction ? "true" : "false"}
    >
      <div className="bg-border grid grid-cols-1 gap-px sm:grid-cols-2">
        <MetaItem
          icon={<IconFolder size={14} />}
          label="Раздел"
          className={!meta.purpose ? "sm:col-span-2" : undefined}
          tone={statusTone}
          valueClassName="whitespace-normal break-words"
        >
          {meta.group} / {meta.parentItem}
        </MetaItem>
        {meta.purpose && (
          <MetaItem
            icon={<IconTarget size={14} />}
            label="Назначение"
            tone={statusTone}
            valueClassName="whitespace-normal break-words"
          >
            {meta.purpose}
          </MetaItem>
        )}
      </div>
      {secondaryMetaItems.length > 0 && (
        <div
          className="bg-border mt-px grid grid-cols-2 gap-px sm:grid-cols-3 lg:[grid-template-columns:repeat(var(--documents-meta-secondary-count),minmax(0,1fr))]"
          style={
            {
              "--documents-meta-secondary-count": secondaryMetaItems.length,
            } as CSSProperties
          }
        >
          {secondaryMetaItems}
        </div>
      )}
    </div>
  );
};
