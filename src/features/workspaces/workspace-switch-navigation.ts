import type { Page } from "@typings/pages";
import type { OrganizationRouteIdentity } from "@features/organizations/organizations-types";
import { getOrganizationRouteKey } from "@features/organizations/organizations-context";
import routes from "@features/routes";
import { findRouteByPath } from "@lib/routes";

const ORGANIZATION_KEY_SEGMENT = "[organizationKey]";
const dynamicSegmentPattern = /\[[^\]]+]/g;

interface ResolveWorkspaceSwitchHrefInput {
  currentPathname?: string | null;
  workspace: OrganizationRouteIdentity;
}

const getWorkspaceDashboardHref = (organizationKey: string) =>
  routes.dashboard.pages.organization_dashboard.path({ organizationKey });

export const isWorkspaceSwitchPreservableRoute = (page: Page | null): page is Page => {
  const dynamicSegments = page?.pathTemplate.match(dynamicSegmentPattern) ?? [];

  return dynamicSegments.length === 1 && dynamicSegments[0] === ORGANIZATION_KEY_SEGMENT;
};

export const resolveWorkspaceSwitchHref = ({
  currentPathname,
  workspace,
}: ResolveWorkspaceSwitchHrefInput): string => {
  const organizationKey = getOrganizationRouteKey(workspace);
  const page = findRouteByPath(currentPathname);

  if (!isWorkspaceSwitchPreservableRoute(page)) {
    return getWorkspaceDashboardHref(organizationKey);
  }

  return page.path({ organizationKey });
};
