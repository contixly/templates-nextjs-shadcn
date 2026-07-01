"use client";

import { Badge } from "@components/ui/badge";
import type { ApiKeyPermissionRecord } from "@features/api-keys/api-keys-types";

interface ApiKeyPermissionsPreviewProps {
  permissions: ApiKeyPermissionRecord | null;
  emptyLabel: string;
}

export function ApiKeyPermissionsPreview({
  permissions,
  emptyLabel,
}: ApiKeyPermissionsPreviewProps) {
  const entries = Object.entries(permissions ?? {}).flatMap(([resource, actions]) =>
    (actions ?? []).map((action) => `${resource}:${action}`)
  );

  if (entries.length === 0) {
    return <span className="text-muted-foreground text-xs">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((entry) => (
        <Badge key={entry} variant="outline">
          {entry}
        </Badge>
      ))}
    </div>
  );
}
