import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Skeleton } from "@components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { cn } from "@lib/utils";
import type { ReactNode } from "react";

const SettingsSectionSkeleton = ({
  children,
  action = false,
  contentClassName,
}: {
  children: ReactNode;
  action?: boolean;
  contentClassName?: string;
}) => (
  <Card role="region" aria-busy="true" aria-label="Loading settings section" className="gap-0 py-0">
    <CardHeader className="border-b px-5 py-4 sm:px-6">
      <CardTitle>
        <Skeleton className="h-4 w-40" />
      </CardTitle>
      <CardDescription>
        <Skeleton className="h-3 w-72 max-w-full" />
      </CardDescription>
      {action ? (
        <CardAction>
          <Skeleton className="h-8 w-28" />
        </CardAction>
      ) : null}
    </CardHeader>
    <CardContent className={cn("px-5 py-5 sm:px-6", contentClassName)}>{children}</CardContent>
  </Card>
);

const FormSkeleton = ({ withButton = true }: { withButton?: boolean }) => (
  <div className="flex flex-col gap-4">
    <div className="grid gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
    {withButton ? <Skeleton className="h-9 w-28" /> : null}
  </div>
);

const UserRowSkeleton = () => (
  <TableRow>
    <TableCell className="min-w-48">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-36" />
    </TableCell>
    <TableCell>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </TableCell>
    <TableCell>
      <Skeleton className="h-4 w-24" />
    </TableCell>
  </TableRow>
);

const GenericTableSkeleton = ({ columns = 4, rows = 3 }: { columns?: number; rows?: number }) => (
  <Table>
    <TableHeader>
      <TableRow>
        {Array.from({ length: columns }).map((_, index) => (
          <TableHead key={index}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: rows }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: columns }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className={cn("h-4", cellIndex === 0 ? "w-36" : "w-24")} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

const UsersTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        {Array.from({ length: 4 }).map((_, index) => (
          <TableHead key={index}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 3 }).map((_, index) => (
        <UserRowSkeleton key={index} />
      ))}
    </TableBody>
  </Table>
);

export const WorkspaceSettingsPageSkeleton = () => (
  <div data-slot="workspace-settings-page-skeleton" className="contents">
    <SettingsSectionSkeleton>
      <FormSkeleton />
    </SettingsSectionSkeleton>
  </div>
);

export const WorkspaceSettingsUsersPageSkeleton = () => (
  <div data-slot="workspace-settings-users-page-skeleton" className="contents">
    <SettingsSectionSkeleton>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </SettingsSectionSkeleton>
    <SettingsSectionSkeleton action>
      <UsersTableSkeleton />
    </SettingsSectionSkeleton>
  </div>
);

export const WorkspaceSettingsTeamsPageSkeleton = () => (
  <div data-slot="workspace-settings-teams-page-skeleton" className="contents">
    <SettingsSectionSkeleton>
      <div className="flex flex-col gap-4">
        <FormSkeleton />
        {[1, 2].map((team) => (
          <Card key={team}>
            <CardHeader>
              <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-3 w-40" />
              </CardDescription>
              <CardAction>
                <Skeleton className="h-8 w-20" />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FormSkeleton />
              <GenericTableSkeleton columns={4} rows={2} />
            </CardContent>
          </Card>
        ))}
      </div>
    </SettingsSectionSkeleton>
  </div>
);

export const WorkspaceSettingsInvitationsPageSkeleton = () => (
  <div data-slot="workspace-settings-invitations-page-skeleton" className="contents">
    <SettingsSectionSkeleton action>
      <GenericTableSkeleton columns={8} rows={3} />
    </SettingsSectionSkeleton>
  </div>
);

export const WorkspaceSettingsPlaceholderPageSkeleton = () => (
  <div data-slot="workspace-settings-placeholder-page-skeleton" className="contents">
    <SettingsSectionSkeleton action>
      <div className="rounded-lg border border-dashed px-4 py-6">
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </SettingsSectionSkeleton>
  </div>
);
