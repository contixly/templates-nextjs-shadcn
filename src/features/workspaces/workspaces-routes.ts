import { Feature } from "@typings/pages";
import { buildFeature } from "@lib/pages";
import { IconTableShare } from "@tabler/icons-react";

type WorkspacesPages = "workspaces" | "workspace";
export type WorkspaceRoutes = Feature<WorkspacesPages>;

const workspaceRoutes: WorkspaceRoutes = buildFeature("workspaces", {
  pages: {
    workspaces: {
      pathTemplate: "/workspaces",
      icon: IconTableShare,

      breadcrumbs: {
        hideTemplateDescription: true,
      },

      title: "Workspaces",
      description:
        "Manage workspaces for projects, teams, or other isolated contexts. Create, configure, and switch between them seamlessly.",
      openGraph: {
        title: "Workspaces",
        description:
          "Organize content across isolated contexts with flexible workspace management.",
      },
    },
    workspace: {
      pathTemplate: "/workspaces/[workspaceId]",

      title: "Workspace",
      description: "Manage workspace settings and related content.",
      openGraph: {
        title: "Workspace",
        description: "Configure and manage workspace settings and related content.",
      },
    },
  },
});

export default workspaceRoutes;
