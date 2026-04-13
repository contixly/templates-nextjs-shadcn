import type { Metadata } from "next";
import { Badge } from "@components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import { HomeCTASection } from "@features/application/components/home-cta-section";
import { templateStackFeatureBlocks } from "@features/application/template-landing-content";
import { Suspense } from "react";
import { buildMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.welcome);

const steps = [
  {
    title: "Explore the default workspace",
    description: "A default workspace is ready. Find it in the sidebar.",
  },
  {
    title: "Customize the codebase",
    description:
      "Add your domain models, routes under src/app/, and feature modules under src/features/.",
  },
  {
    title: "Ship",
    description:
      "Deploy with your hosting provider and iterate — this template is only the foundation.",
  },
];

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  return (
    <div className="flex flex-col">
      {/* Welcome Header */}
      <section className="flex flex-col items-center gap-6 px-6 py-16 text-center md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Welcome</h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Your account has been created and a default workspace is ready. Here&rsquo;s what this
            template includes.
          </p>
        </div>
      </section>

      <Separator />

      {/* Feature Highlights */}
      <section className="flex flex-col items-center gap-10 px-6 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">What is included</h2>
          <p className="text-muted-foreground text-sm">
            Same overview as the public landing page — edit copy in template-landing-content.ts.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 md:grid-cols-2">
          {templateStackFeatureBlocks.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <feature.icon className="text-foreground size-5" />
                  <Badge variant="secondary">{feature.badge}</Badge>
                </div>
                <CardTitle className="mt-2">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Quick Start Steps */}
      <section className="flex flex-col items-center gap-10 px-6 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col items-center gap-3 text-center">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">Get started in 3 steps</h2>
        </div>

        <div className="grid w-full max-w-xl gap-4 text-sm">
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3 text-left">
              <div className="bg-primary/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">{index + 1}</span>
              </div>
              <div>
                <p className="text-foreground font-medium">{step.title}</p>
                <p className="text-muted-foreground">{step.description}</p>
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
