import * as React from "react";
import Link from "next/link";

type TransitionType = "fade";

export type AnimatedLinkProps = React.ComponentPropsWithoutRef<typeof Link> & {
  transitionTypes?: TransitionType[];
};

/**
 * AnimatedLink
 *
 * Thin wrapper around Next.js Link that adds consistent fade transitions.
 * Import it as `AnimatedLink` and alias it to `Link` where you want the same API:
 *
 * import { AnimatedLink as Link } from "@components/ui/custom/animated-link"
 */
export default function AnimatedLink({
  children,
  transitionTypes = ["fade"],
  ...props
}: AnimatedLinkProps) {
  return (
    <Link transitionTypes={transitionTypes}{...props}>{children}</Link>
  );
}
