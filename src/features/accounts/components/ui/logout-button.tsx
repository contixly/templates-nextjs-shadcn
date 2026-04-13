import React, { useCallback } from "react";
import { Button, buttonVariants } from "@components/ui/button";
import type { VariantProps } from "class-variance-authority";
import { usePathname, useRouter } from "next/navigation";
import routes from "@features/routes";
import { signOut } from "@lib/auth-client";

/**
 * LogoutButton is a React functional component designed to provide a customizable button
 * that triggers the logout functionality. It is built with support for styling variants
 * and optionally renders as a child of another component.
 *
 * @param {Object} props - The props object for the LogoutButton component.
 * @param {boolean} [props.asChild] - If true, the button will render as a child component,
 * allowing for further customization in the parent component.
 */
export const LogoutButton = (
  props: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
) => {
  const { logout } = useLogout();

  return (
    <Button onClick={logout} {...props}>
      Log out
    </Button>
  );
};

/**
 * Custom hook that provides a logout functionality.
 *
 * The `useLogout` hook facilitates user sign-out and redirects
 * them to a specified login page. Once the `logout` function
 * is called, the current path is passed as a query parameter
 * to the login page for redirection purposes after authentication.
 *
 * Dependencies:
 * - `usePathname`: Retrieves the current pathname.
 * - `useRouter`: Provides navigation functionality.
 * - `signOut`: Handles the sign-out process.
 *
 * Returns:
 * An object containing:
 * - `logout`: A function that triggers the sign-out process and handles redirection.
 */
export const useLogout = () => {
  const path = usePathname();
  const router = useRouter();

  const logoutHandler = useCallback(
    () =>
      signOut().then(() => {
        router.push(routes.accounts.pages.login.path({ query: { redirect: path } }));
      }),
    [path, router]
  );

  return {
    logout: logoutHandler,
  };
};
