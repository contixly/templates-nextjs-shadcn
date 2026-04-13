"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { findRouteByPath } from "@lib/routes";

export const useCurrentPage = () => {
  const pathname = usePathname();

  return useMemo(() => findRouteByPath(pathname), [pathname]);
};
