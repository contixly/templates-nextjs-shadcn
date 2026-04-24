import { buildPageMetadata, GlobalMetadata } from "@lib/metadata";
import workspaceRoutes from "@features/workspaces/workspaces-routes";
import { buildMetadataOGImage } from "@lib/metadata-og";

export const alt = GlobalMetadata.applicationName as string;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const page = workspaceRoutes.pages.settings_users;
const opengraphImage = async ({ params }: { params: Promise<{ organizationKey: string }> }) =>
  buildMetadataOGImage(await buildPageMetadata(page, await params), page.featureName);

export default opengraphImage;
