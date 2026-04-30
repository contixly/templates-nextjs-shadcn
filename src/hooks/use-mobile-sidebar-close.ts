"use client";

import { useCallback } from "react";
import { useSidebar } from "@components/ui/sidebar";

export const useMobileSidebarClose = () => {
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return { isMobile, closeMobileSidebar };
};
