import type { Metadata } from "next";
import { ChartAreaInteractive } from "@features/dashboard/ui/template/chart-area-interactive";
import { DataTable } from "@features/dashboard/ui/template/data-table";
import { SectionCards } from "@features/dashboard/ui/template/section-cards";
import data from "./data.json";
import { Suspense } from "react";
import { buildPageMetadata } from "@lib/metadata";
import dashboardRoutes from "@features/dashboard/dashboard-routes";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(dashboardRoutes.pages.application_dashboard);

export default function GlobalDashboardPage() {
  return (
    <div className="flex flex-col gap-6 py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <Suspense>
        <DataTable data={data} />
      </Suspense>
    </div>
  );
}
