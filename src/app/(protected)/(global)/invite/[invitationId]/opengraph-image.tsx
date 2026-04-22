import { buildPageMetadata, GlobalMetadata } from "@lib/metadata";
import routes from "@features/routes";
import { buildMetadataOGImage } from "@lib/metadata-og";

export const alt = GlobalMetadata.applicationName as string;

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const page = routes.accounts.pages.invitation;
const opengraphImage = async ({ params }: { params: Promise<{ invitationId: string }> }) =>
  buildMetadataOGImage(await buildPageMetadata(page, await params), page.featureName);

export default opengraphImage;
