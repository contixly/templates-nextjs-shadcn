import { Feature } from "@typings/pages";
import { IconHome } from "@tabler/icons-react";
import { buildFeature } from "@lib/pages";

type ApplicationPages = "home";
export type ApplicationRoutes = Feature<ApplicationPages>;

const applicationRoutes: ApplicationRoutes = buildFeature("application", {
  pages: {
    home: {
      pathTemplate: "/",
      icon: IconHome,
    },
  },
});

export default applicationRoutes;
