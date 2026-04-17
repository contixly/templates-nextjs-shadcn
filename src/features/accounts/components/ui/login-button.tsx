import React from "react";
import Link from "@components/ui/custom/animated-link";
import { Button, buttonVariants } from "@components/ui/button";
import type { VariantProps } from "class-variance-authority";
import routes from "@features/routes";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/**
 * A customizable login button component that redirects users to the login page.
 *
 * The `LoginButton` component is built using a combination of button and link functionalities.
 * It supports passing props for styling and variant configuration and allows optional customization
 * as a child component. The button dynamically generates a redirect query based on the current pathname.
 *
 * Props:
 * - `props` (React.ComponentProps<"button">): Props that can be passed to a standard HTML button element.
 * - `asChild` (boolean, optional): Determines if the button content should be rendered as a child component.
 * - VariantProps: Accepts properties for styling variations specific to `buttonVariants`.
 */
export const LoginButton = (
  props: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
) => {
  const t = useTranslations("accounts.ui.loginButton");
  const path = usePathname();

  return (
    <Link href={routes.accounts.pages.login.path({ query: { redirect: path } })}>
      <Button {...props}>{t("login")}</Button>
    </Link>
  );
};
