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
  id: "routing" | "actions" | "database" | "auth" | "features" | "ui";
};

export const templateStackFeatureBlocks: TemplateStackFeature[] = [
  {
    icon: IconRoute,
    id: "routing",
  },
  {
    icon: IconServer,
    id: "actions",
  },
  {
    icon: IconDatabase,
    id: "database",
  },
  {
    icon: IconLock,
    id: "auth",
  },
  {
    icon: IconLayersSubtract,
    id: "features",
  },
  {
    icon: IconComponents,
    id: "ui",
  },
];

export type TemplateExtensionPoint = {
  icon: TablerIcon;
  id: "clients" | "webhooks" | "storage";
};

export const templateExtensionPointBlocks: TemplateExtensionPoint[] = [
  {
    icon: IconPlug,
    id: "clients",
  },
  {
    icon: IconWebhook,
    id: "webhooks",
  },
  {
    icon: IconCloud,
    id: "storage",
  },
];
