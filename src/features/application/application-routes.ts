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

      title: "Home",
      description:
        "A neutral starting point for the template application with shared UI, auth flows, and reusable layout patterns.",
      openGraph: {
        title: "Home",
        description: "A template application ready to be adapted into your own service.",
      },
    },
  },
});

export default applicationRoutes;
