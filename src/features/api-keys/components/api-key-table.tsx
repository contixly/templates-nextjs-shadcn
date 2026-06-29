"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { IconDotsVertical, IconKey, IconPencil, IconTrash } from "@tabler/icons-react";
import { timeTools } from "@lib/time";
import { ApiKeyDeleteControl } from "@features/api-keys/components/api-key-delete-control";
import { ApiKeyEditDialog } from "@features/api-keys/components/api-key-edit-dialog";
import { ApiKeyPermissionsPreview } from "@features/api-keys/components/api-key-permissions-preview";
import type {
  ApiKeyListItemDto,
  ApiKeyManagementCapabilities,
  ApiKeyOwnerType,
} from "@features/api-keys/api-keys-types";

interface ApiKeyTableProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  organizationKey?: string;
  keys: ApiKeyListItemDto[];
  capabilities: ApiKeyManagementCapabilities;
}

const getStatusVariant = (status: ApiKeyListItemDto["status"]) => {
  if (status === "active") {
    return "secondary";
  }

  if (status === "expired") {
    return "destructive";
  }

  return "outline";
};

const getRateLimitWindowKey = (windowMs: number | null) => {
  switch (windowMs) {
    case 60 * 1000:
      return "rateLimitWindow.1m";
    case 60 * 60 * 1000:
      return "rateLimitWindow.1h";
    case 24 * 60 * 60 * 1000:
      return "rateLimitWindow.1d";
    default:
      return null;
  }
};

export function ApiKeyTable({
  ownerType,
  organizationId,
  organizationKey,
  keys,
  capabilities,
}: ApiKeyTableProps) {
  const t = useTranslations("apiKeys.ui");
  const locale = useLocale();
  const isReadOnly =
    ownerType === "organization" &&
    !capabilities.canCreate &&
    !capabilities.canUpdate &&
    !capabilities.canDelete;

  if (keys.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconKey />
          </EmptyMedia>
          <EmptyTitle>{t("table.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("table.emptyDescription")}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isReadOnly ? (
        <p className="text-muted-foreground text-sm">{t("table.readOnlyNotice")}</p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.columns.name")}</TableHead>
            <TableHead>{t("table.columns.key")}</TableHead>
            <TableHead>{t("table.columns.scopes")}</TableHead>
            <TableHead>{t("table.columns.rateLimit")}</TableHead>
            <TableHead>{t("table.columns.expires")}</TableHead>
            <TableHead>{t("table.columns.lastUsed")}</TableHead>
            <TableHead>{t("table.columns.created")}</TableHead>
            <TableHead className="w-12 text-right">{t("table.columns.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell className="min-w-44">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate font-medium">{apiKey.name ?? apiKey.id}</span>
                  <Badge className="w-fit" variant={getStatusVariant(apiKey.status)}>
                    {t(`table.status.${apiKey.status}`)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <code className="bg-muted text-muted-foreground px-1.5 py-1 text-xs">
                  {apiKey.start ?? apiKey.prefix ?? apiKey.id}
                </code>
              </TableCell>
              <TableCell className="min-w-56 whitespace-normal">
                <ApiKeyPermissionsPreview
                  permissions={apiKey.permissions}
                  emptyLabel={t("form.noPermissions")}
                />
              </TableCell>
              <TableCell>{formatRateLimit(apiKey, t)}</TableCell>
              <TableCell>
                {apiKey.expiresAt
                  ? timeTools.formatDate(apiKey.expiresAt, locale)
                  : t("table.never")}
              </TableCell>
              <TableCell>
                {apiKey.lastRequest
                  ? timeTools.formatRelativeTime(apiKey.lastRequest, locale)
                  : t("table.notUsed")}
              </TableCell>
              <TableCell>{timeTools.formatDate(apiKey.createdAt, locale)}</TableCell>
              <TableCell className="text-right">
                <ApiKeyRowActions
                  ownerType={ownerType}
                  organizationId={organizationId}
                  organizationKey={organizationKey}
                  apiKey={apiKey}
                  capabilities={capabilities}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ApiKeyRowActions({
  ownerType,
  organizationId,
  organizationKey,
  apiKey,
  capabilities,
}: {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  organizationKey?: string;
  apiKey: ApiKeyListItemDto;
  capabilities: ApiKeyManagementCapabilities;
}) {
  const t = useTranslations("apiKeys.ui");

  if (!capabilities.canUpdate && !capabilities.canDelete) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <IconDotsVertical />
          <span className="sr-only">{t("table.columns.actions")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {capabilities.canUpdate ? (
            <ApiKeyEditDialog
              ownerType={ownerType}
              organizationId={organizationId}
              organizationKey={organizationKey}
              apiKey={apiKey}
              trigger={
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <IconPencil />
                  {t("table.actions.edit")}
                </DropdownMenuItem>
              }
            />
          ) : null}
          {capabilities.canDelete ? (
            <ApiKeyDeleteControl
              ownerType={ownerType}
              organizationId={organizationId}
              organizationKey={organizationKey}
              apiKey={apiKey}
              trigger={
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => event.preventDefault()}
                >
                  <IconTrash />
                  {t("table.actions.delete")}
                </DropdownMenuItem>
              }
            />
          ) : null}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function formatRateLimit(
  apiKey: Pick<ApiKeyListItemDto, "rateLimitEnabled" | "rateLimitMax" | "rateLimitTimeWindow">,
  t: (key: string) => string
) {
  if (!apiKey.rateLimitEnabled || !apiKey.rateLimitMax || !apiKey.rateLimitTimeWindow) {
    return t("table.unlimited");
  }

  const windowKey = getRateLimitWindowKey(apiKey.rateLimitTimeWindow);
  const windowLabel = windowKey ? t(windowKey) : `${apiKey.rateLimitTimeWindow}ms`;

  return `${apiKey.rateLimitMax} / ${windowLabel}`;
}
