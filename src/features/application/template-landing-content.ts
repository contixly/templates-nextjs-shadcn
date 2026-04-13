import type { TablerIcon } from "@tabler/icons-react";
import {
  IconCloud,
  IconComponents,
  IconDatabase,
  IconLayersSubtract,
  IconLock,
  IconPlug,
  IconRoute,
  IconServer,
  IconWebhook,
} from "@tabler/icons-react";

/** Shared marketing copy for public home and authenticated welcome — replace with your product story. */
export type TemplateStackFeature = {
  icon: TablerIcon;
  title: string;
  description: string;
  badge: string;
};

export const templateStackFeatureBlocks: TemplateStackFeature[] = [
  {
    icon: IconRoute,
    title: "App Router & layouts",
    description:
      "Route groups, metadata, and shared shells you can reshape for marketing, auth, and authenticated areas.",
    badge: "Included",
  },
  {
    icon: IconServer,
    title: "Server actions & validation",
    description:
      "Typed mutations with Zod, protected actions, and cache invalidation patterns ready to extend.",
    badge: "Included",
  },
  {
    icon: IconDatabase,
    title: "Prisma & PostgreSQL",
    description:
      "Schema, migrations, and a singleton data layer — point `DATABASE_URL` at your database and evolve the model.",
    badge: "Included",
  },
  {
    icon: IconLock,
    title: "Better Auth & OAuth",
    description:
      "Session handling and social providers; configure secrets and callback URLs for your environments.",
    badge: "Included",
  },
  {
    icon: IconLayersSubtract,
    title: "Feature-sliced modules",
    description:
      "Business logic grouped under `features/` with repositories, actions, and routes to mirror your domain.",
    badge: "Included",
  },
  {
    icon: IconComponents,
    title: "shadcn/ui & Tailwind",
    description:
      "Accessible primitives and tokens — swap themes, add screens, and keep UI consistent as you grow.",
    badge: "Included",
  },
];

export type TemplateExtensionPoint = {
  icon: TablerIcon;
  title: string;
  description: string;
};

export const templateExtensionPointBlocks: TemplateExtensionPoint[] = [
  {
    icon: IconPlug,
    title: "REST or GraphQL clients",
    description: "Add SDKs or fetch wrappers for the APIs your product depends on.",
  },
  {
    icon: IconWebhook,
    title: "Inbound webhooks",
    description: "Expose routes that turn provider events into your own domain records.",
  },
  {
    icon: IconCloud,
    title: "File & object storage",
    description: "Optional S3-style storage hooks for uploads when your feature needs blobs.",
  },
];
