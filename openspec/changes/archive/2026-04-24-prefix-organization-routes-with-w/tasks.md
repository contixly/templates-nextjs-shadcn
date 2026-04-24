## 1. Route Tree and Definitions

- [x] 1.1 Re-read relevant Next.js App Router docs from `node_modules/next/dist/docs/` before implementation.
- [x] 1.2 Move organization route files from `src/app/(protected)/(global)/[organizationKey]` to `src/app/(protected)/(global)/w/[organizationKey]`.
- [x] 1.3 Update workspace and dashboard route `pathTemplate` values from `"/[organizationKey]..."` to `"/w/[organizationKey]..."`.
- [x] 1.4 Remove the root dynamic organization route so unprefixed `/:organizationKey` is no longer an organization route.

## 2. Generated Links and Route Consumers

- [x] 2.1 Update global dashboard redirects to emit `/w/:organizationKey/dashboard`.
- [x] 2.2 Update workspace creation, workspace switching, workspace cards, invitation flows, settings navigation, breadcrumbs, and metadata consumers to use route definitions that emit `/w` URLs.
- [x] 2.3 Keep `organizationKey` as the dynamic parameter name in route params, guards, loaders, and client hooks.
- [x] 2.4 Confirm workspace slug validation and generation remain focused on formatting and database uniqueness, with no route-segment denylist.

## 3. Verification

- [x] 3.1 Update route-resolution and navigation tests to expect `/w/:organizationKey/...`.
- [x] 3.2 Update page, metadata, switcher, dashboard, workspace settings, and invitation tests affected by organization URL generation.
- [x] 3.3 Search for stale `"/[organizationKey]"`, `/:organizationKey`, and unprefixed organization path literals and update or remove them.
- [x] 3.4 Run the relevant Jest tests and project linting.
