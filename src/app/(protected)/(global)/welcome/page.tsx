import type { Metadata } from "next";
import { Badge } from "@components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Separator } from "@components/ui/separator";
import {
  IconCheckbox,
  IconFolders,
  IconLayoutDashboard,
  IconNotebook,
  IconSparkles,
  IconTarget,
} from "@tabler/icons-react";
import { HomeCTASection } from "@features/application/components/home-cta-section";
import { Suspense } from "react";
import { buildMetadata } from "@lib/metadata";
import accountsRoutes from "@features/accounts/accounts-routes";

export const metadata: Metadata = buildMetadata(accountsRoutes.pages.welcome);

const features = [
  {
    icon: IconFolders,
    title: "Workspaces",
    description: "Organize content into isolated contexts for projects, teams, or clients.",
    badge: "Ready" as const,
  },
  {
    icon: IconNotebook,
    title: "Rich Notes",
    description: "An editor with auto-save, slash commands, and full formatting support.",
    badge: "Ready" as const,
  },
  {
    icon: IconCheckbox,
    title: "Smart Tasks",
    description: "Checklists, due dates, priorities, and completion tracking.",
    badge: "Coming" as const,
  },
  {
    icon: IconLayoutDashboard,
    title: "Dashboard",
    description: "At-a-glance overview of activity, summaries, and next steps.",
    badge: "Coming" as const,
  },
  {
    icon: IconSparkles,
    title: "AI Assistance",
    description: "AI helpers for suggestions, expansion, and generation with clear boundaries.",
    badge: "Planned" as const,
  },
  {
    icon: IconTarget,
    title: "Goals",
    description: "Track longer-term objectives and link tasks or notes when needed.",
    badge: "Planned" as const,
  },
];

const badgeVariant: Record<"Ready" | "Coming" | "Planned", "default" | "secondary" | "outline"> = {
  Ready: "default",
  Coming: "secondary",
  Planned: "outline",
};

const steps = [
  {
    title: "Explore the default workspace",
    description: "A default workspace is ready. Find it in the sidebar.",
  },
  {
    title: "Create Content",
    description: "Add notes with the editor or plan tasks to stay on track.",
  },
  {
    title: "Grow the template",
    description: "Create additional workspaces for projects, teams, or other contexts anytime.",
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
            Use these building blocks as a base for your own service.
          </p>
        </div>

        <div className="grid w-full max-w-2xl gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <feature.icon className="text-foreground size-5" />
                  <Badge variant={badgeVariant[feature.badge]}>{feature.badge}</Badge>
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
