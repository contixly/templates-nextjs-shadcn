"use client";

import { IconBook2 } from "@tabler/icons-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@components/ui/button";
import routes from "@features/routes";
import { cn } from "@lib/utils";

export const DocumentationRootLink = ({ className }: { className?: string }) => {
  const t = useTranslations("application.ui.navigation");
  const label = t("documentation");

  return (
    <Button asChild variant="outline" size="icon" className={cn(className)}>
      <Link href={routes.documents_system.pages.home.path()} aria-label={label} title={label}>
        <IconBook2 aria-hidden="true" />
      </Link>
    </Button>
  );
};
