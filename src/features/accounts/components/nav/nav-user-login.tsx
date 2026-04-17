"use client";

import React, { Suspense, use, useState } from "react";
import { LoginButton } from "@features/accounts/components/ui/login-button";
import { LogoutButton } from "@features/accounts/components/ui/logout-button";
import { Button, buttonVariants } from "@components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import routes from "@features/routes";
import { VariantProps } from "class-variance-authority";
import { socialsProviders } from "@typings/auth";
import { ProviderButton } from "@features/accounts/components/ui/provider-button";
import Link from "@components/ui/custom/animated-link";
import { useTranslations } from "next-intl";

type NavUserLoginProps = {
  loadCurrentUserIdPromise: Promise<string | null>;
  getLastLoginPromise: Promise<string | undefined>;
  dotShowLogout?: boolean;
  showHomepageCTA?: boolean;
} & VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

/**
 * NavUserLoginComponent is a functional React component that manages
 * the display of login and logout buttons based on the user's login status.
 *
 */
const NavUserLoginComponent = ({
  loadCurrentUserIdPromise,
  getLastLoginPromise,
  dotShowLogout,
  showHomepageCTA,
  ...props
}: NavUserLoginProps) => {
  const t = useTranslations("application.ui.navigation");
  const userId = use(loadCurrentUserIdPromise);
  const lastMethod = use(getLastLoginPromise);
  const [isPending, setIsPending] = useState(false);

  if (!userId && !showHomepageCTA) {
    return <LoginButton {...props} />;
  }

  if (!userId && showHomepageCTA)
    return (
      <div className="flex items-center gap-3">
        <Button asChild size="lg">
          <Link
            href={routes.accounts.pages.login.path({
              query: { redirect: routes.dashboard.pages.application_dashboard.path() },
            })}
          >
            {t("getStarted")}
            <IconArrowRight className="size-4" />
          </Link>
        </Button>
        {lastMethod &&
          socialsProviders
            .filter((provider) => provider.id === lastMethod)
            .map((provider) => (
              <ProviderButton
                key={provider.id}
                provider={provider}
                lastMethod={lastMethod}
                size="lg"
                redirectTo={routes.dashboard.pages.application_dashboard.path()}
                isPending={isPending}
                setIsPending={setIsPending}
              />
            ))}
      </div>
    );

  if (userId && showHomepageCTA)
    return (
      <div className="flex items-center gap-3">
        <Button asChild size="lg">
          <Link href={routes.dashboard.pages.application_dashboard.path()}>
            {t("goToDashboard")}
            <IconArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    );

  if (!dotShowLogout) return <LogoutButton />;

  return null;
};

/**
 * NavUserLogin is a functional component responsible for rendering
 * the navigation user login UI. This component wraps the
 * NavUserLoginComponent with a React Suspense boundary.
 *
 * It takes all the properties defined in NavUserLoginProps
 * and passes them down to the NavUserLoginComponent.
 *
 * The Suspense component ensures that any asynchronous content
 * within NavUserLoginComponent is handled gracefully, providing
 * a fallback UI during the loading state.
 *
 * @param {NavUserLoginProps} props - The properties to configure the navigation user login functionality.
 */
export const NavUserLogin = (props: NavUserLoginProps) => (
  <Suspense>
    <NavUserLoginComponent {...props} />
  </Suspense>
);
