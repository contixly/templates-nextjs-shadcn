"use client";

import React, { useState, useEffect } from "react";
import { Kbd, KbdGroup } from "@components/ui/kbd";
import { SidebarTrigger } from "@components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@components/ui/tooltip";
import { Button } from "@components/ui/button";
import { IconLayoutSidebar } from "@tabler/icons-react";

interface AppSiteHeaderTriggerProps {
  hidden?: boolean;
}

/**
 * Client component that handles the sidebar trigger with tooltip.
 * Uses a mounted state to prevent hydration mismatches caused by
 * nested Suspense boundaries and Radix UI's SSR behavior.
 */
export const AppSiteHeaderTrigger = ({ hidden }: AppSiteHeaderTriggerProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (hidden) {
    return null;
  }

  // Render a static placeholder during SSR and initial hydration
  // This prevents hydration mismatch by ensuring server and client
  // render the same HTML structure
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="md:-ml-1"
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        aria-label="Toggle sidebar"
      >
        <IconLayoutSidebar aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger
          className="md:-ml-1"
          variant="outline"
          size="icon"
          aria-label="Toggle sidebar"
        />
      </TooltipTrigger>
      <TooltipContent>
        Toggle Sidebar{" "}
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>H</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
};
