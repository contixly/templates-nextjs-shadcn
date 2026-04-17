import type { Metadata } from "next";
import { Badge } from "@components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { HomeCTASection } from "@features/application/components/home-cta-section";
import { templateStackFeatureBlocks } from "@features/application/template-landing-content";
import { Suspense } from "react";
import { buildPageMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";
import { getTranslations } from "next-intl/server";

export const generateMetadata = async (): Promise<Metadata> =>
  buildPageMetadata(accountsRoutes.pages.welcome);

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const t = await getTranslations("application.pages.welcome");
  const tHome = await getTranslations("application.pages.home");

  const steps = [
    {
      id: "explore",
    },
    {
      id: "customize",
    },
    {
      id: "ship",
    },
  ] as const;

  return (
    <div className="flex flex-col">
      {/* Welcome Header */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">{t("title")}</h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            {t("description")}
          </p>
        </div>
      </section>

      <Separator />

      {/* Feature Highlights */}
      <section className="flex flex-col items-center gap-10 px-6 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">{t("includedTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("includedDescription")}</p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 md:grid-cols-2">
          {templateStackFeatureBlocks.map((feature) => (
            <Card key={feature.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <feature.icon className="text-foreground size-5" />
                  <Badge variant="secondary">
                    {tHome(`featureBlocks.${feature.id}.badge` as never)}
                  </Badge>
                </div>
                <CardTitle className="mt-2">
                  {tHome(`featureBlocks.${feature.id}.title` as never)}
                </CardTitle>
                <CardDescription>
                  {tHome(`featureBlocks.${feature.id}.description` as never)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Quick Start Steps */}
      <section className="flex flex-col items-center gap-10 px-6 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">{t("stepsTitle")}</h2>
        </div>

        <div className="grid w-full max-w-xl gap-4 text-sm">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3 text-left">
              <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">{index + 1}</span>
              </div>
              <div>
                <p className="text-foreground font-medium">
                  {t(`steps.${step.id}.title` as never)}
                </p>
                <p className="text-muted-foreground">
                  {t(`steps.${step.id}.description` as never)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <Suspense>
        <HomeCTASection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
