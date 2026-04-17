"use client";

import { Button } from "@components/ui/button";
import Link from "@components/ui/custom/animated-link";
import { IconArrowRight } from "@tabler/icons-react";
import { use } from "react";
import { useTranslations } from "next-intl";
import routes from "@features/routes";

interface HomeCTASectionProps {
  searchParams: Promise<{ redirect?: string }>;
}

export const HomeCTASection = ({ searchParams }: HomeCTASectionProps) => {
  const t = useTranslations("application.ui.homeCta");
  const { redirect } = use(searchParams);
  const redirectUrl = redirect || routes.dashboard.pages.application_dashboard.path();

  return (
    <section className="flex flex-col items-center gap-6 px-6 py-16 text-center md:py-24">
      <h2 className="text-xl font-bold tracking-tight md:text-2xl">{t("title")}</h2>
      <p className="text-muted-foreground max-w-md text-sm">{t("description")}</p>
      <Button asChild size="lg">
        <Link href={redirectUrl}>
          {t("openDashboard")}
          <IconArrowRight className="size-4" />
        </Link>
      </Button>
    </section>
  );
};
