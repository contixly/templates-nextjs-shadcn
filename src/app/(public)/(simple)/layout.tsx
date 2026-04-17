import React from "react";
import routes from "@features/routes";
import Link from "@components/ui/custom/animated-link";
import { Button } from "@components/ui/button";
import { IconHome } from "@tabler/icons-react";
import { ThemeSwitcher } from "@components/application/theme/theme-switcher";
import { useTranslations } from "next-intl";

export default function SimpleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = useTranslations("common.ui.accessibility");

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-muted z-10 flex h-12 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) md:sticky md:top-0">
        <div className="flex w-full items-center gap-1 pr-2 pl-1 md:pl-4 lg:gap-2 lg:pl-4">
          <div className="ms-auto flex items-center gap-2">
            <Button asChild variant="outline" size="icon">
              <Link href={routes.application.pages.home.path()} aria-label={t("goHomePage")}>
                <IconHome />
              </Link>
            </Button>
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main id="main-content" className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
