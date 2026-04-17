import type { Metadata } from "next";
import Image from "next/image";
import { Badge } from "@components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { IconLock, IconTerminal } from "@tabler/icons-react";
import { loadCurrentUserId } from "@features/accounts/accounts-actions";
import { NavUserLogin } from "@features/accounts/components/nav/nav-user-login";
import { buildPageMetadata } from "@lib/metadata";
import applicationRoutes from "@features/application/application-routes";
import {
  templateExtensionPointBlocks,
  templateStackFeatureBlocks,
} from "@features/application/template-landing-content";
import { getFromCookie } from "@lib/cookies";
import { LAST_LOGIN_METHOD_KEY } from "@lib/environment";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(applicationRoutes.pages.home);

export default async function HomePage() {
  const t = await getTranslations("application.pages.home");
  const loadCurrentUserIdPromise = loadCurrentUserId();
  const getLastLoginPromise = getFromCookie(LAST_LOGIN_METHOD_KEY);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-8 px-4 py-20 text-center md:px-6 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.95_0.02_260)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.2_0.03_260)_0%,transparent_70%)]" />
        <div className="relative flex max-w-3xl flex-col items-center gap-6">
          <Badge variant="outline" className="gap-1.5">
            <IconTerminal aria-hidden="true" className="size-3" />
            {t("heroBadge")}
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight text-pretty md:text-5xl">
            {t("heroTitlePrefix")}
            <br />
            <span className="text-muted-foreground">{t("heroTitleEmphasis")}</span>
          </h1>

          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed md:text-base">
            {t("heroDescription")}
          </p>

          <NavUserLogin
            loadCurrentUserIdPromise={loadCurrentUserIdPromise}
            getLastLoginPromise={getLastLoginPromise}
            dotShowLogout
            showHomepageCTA
          />

          <div className="text-muted-foreground flex flex-col items-center gap-2 text-xs sm:flex-row sm:gap-4">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <IconLock aria-hidden="true" className="size-3 shrink-0" />
              {t("heroSecurity")}
            </span>
          </div>
        </div>
      </section>

      <Separator />

      {/* Features */}
      <section className="flex flex-col items-center gap-10 px-4 py-16 md:px-6 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-bold tracking-tight text-pretty md:text-2xl">
            {t("featuresTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("featuresDescription")}</p>
        </div>

        <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templateStackFeatureBlocks.map((feature) => (
            <Card key={feature.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <feature.icon aria-hidden="true" className="text-foreground size-5" />
                  <Badge variant="secondary">{t(`featureBlocks.${feature.id}.badge`)}</Badge>
                </div>
                <CardTitle className="mt-2">{t(`featureBlocks.${feature.id}.title`)}</CardTitle>
                <CardDescription>{t(`featureBlocks.${feature.id}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Integrations */}
      <section className="flex flex-col items-center gap-10 px-4 py-16 md:px-6 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <Badge variant="secondary">{t("extensionsBadge")}</Badge>
          <h2 className="text-xl font-bold tracking-tight text-pretty md:text-2xl">
            {t("extensionsTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">{t("extensionsDescription")}</p>
        </div>

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
          {templateExtensionPointBlocks.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3">
                <item.icon aria-hidden="true" className="text-foreground size-5" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {t(`extensionBlocks.${item.id}.title`)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {t(`extensionBlocks.${item.id}.description`)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tech stack */}
      <section className="flex flex-col items-center gap-6 px-4 py-16 md:px-6 md:py-24">
        <h2 className="text-xl font-bold tracking-tight text-pretty md:text-2xl">
          {t("stackTitle")}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "Next.js 16",
            "React 19",
            "TypeScript",
            "Tailwind v4",
            "Prisma",
            "PostgreSQL",
            "Better Auth",
            "shadcn/ui",
          ].map((tech) => (
            <Badge key={tech} variant="outline">
              {tech}
            </Badge>
          ))}
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <section className="flex flex-col items-center gap-6 px-4 py-16 text-center md:px-6 md:py-24">
        <Image
          src="/img/branding/template_logo_nb_s.png"
          alt={t("logoAlt")}
          width={48}
          height={48}
          style={{ width: "auto", height: "auto" }}
          className="opacity-80"
        />
        <h2 className="text-xl font-bold tracking-tight text-pretty md:text-2xl">
          {t("ctaTitle")}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">{t("ctaDescription")}</p>
        <NavUserLogin
          loadCurrentUserIdPromise={loadCurrentUserIdPromise}
          getLastLoginPromise={getLastLoginPromise}
          dotShowLogout
          showHomepageCTA
        />
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-8 md:px-6">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-xs md:flex-row">
          <span>{t("footer")}</span>
          <div className="flex items-center gap-4">
            <span>example.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
