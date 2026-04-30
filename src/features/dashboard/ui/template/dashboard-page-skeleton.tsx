import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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

const DashboardCardSkeleton = () => (
  <Card className="@container/card">
    <CardHeader>
      <CardDescription>
        <Skeleton className="h-4 w-24" />
      </CardDescription>
      <CardTitle>
        <Skeleton className="h-8 w-32" />
      </CardTitle>
      <CardAction>
        <Skeleton className="h-6 w-20" />
      </CardAction>
    </CardHeader>
    <CardFooter className="flex-col items-start gap-1.5">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-44 max-w-full" />
    </CardFooter>
  </Card>
);

const DashboardTableSkeleton = () => (
  <div className="px-4 lg:px-6">
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 7 }).map((_, index) => (
              <TableHead key={index}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: 7 }).map((__, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className={cn("h-4", cellIndex === 2 ? "w-40" : "w-24")} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

export const OrganizationDashboardPageSkeleton = () => (
  <div
    data-slot="organization-dashboard-page-skeleton"
    aria-busy="true"
    className="flex flex-col gap-6 py-6"
  >
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <DashboardCardSkeleton key={index} />
      ))}
    </div>
    <div className="px-4 lg:px-6">
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-5 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64 max-w-full" />
          </CardDescription>
          <CardAction>
            <Skeleton className="h-8 w-40" />
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
    <DashboardTableSkeleton />
  </div>
);
