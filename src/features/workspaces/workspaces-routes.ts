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
    },
    workspace: {
      pathTemplate: "/workspaces/[workspaceId]",
    },
  },
});

export default workspaceRoutes;
