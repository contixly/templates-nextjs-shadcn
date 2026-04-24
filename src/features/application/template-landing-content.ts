import type { TablerIcon } from "@tabler/icons-react";
import {
  IconDatabase,
  IconMail,
  IconRoute,
  IconServer,
  IconSettings,
  IconShield,
  IconTableShare,
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
    icon: IconTableShare,
    id: "auth",
  },
  {
    icon: IconMail,
    id: "features",
  },
  {
    icon: IconSettings,
    id: "ui",
  },
];

export type TemplateExtensionPoint = {
  icon: TablerIcon;
  id: "clients" | "webhooks" | "storage";
};

export const templateExtensionPointBlocks: TemplateExtensionPoint[] = [
  {
    icon: IconSettings,
    id: "clients",
  },
  {
    icon: IconMail,
    id: "webhooks",
  },
  {
    icon: IconShield,
    id: "storage",
  },
];
