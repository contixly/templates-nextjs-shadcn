import common from "@messages/common.json";
import { Icon as IconType } from "@tabler/icons-react";
import React, { PropsWithChildren } from "react";
import Link from "@components/ui/custom/animated-link";
import { Button } from "@components/ui/button";
import routes from "@features/routes";

export interface ErrorComponentProps extends PropsWithChildren {
  title?: string;
  subTitle?: string;
  description?: string;
  externalNodes?: React.ReactNode;
  homeLinkDisabled?: boolean;
  backLinkDisabled?: boolean;
  icon?: IconType;
  error?: Error;
}

export const ErrorComponent = ({
  title,
  subTitle,
  description,
  externalNodes,
  homeLinkDisabled,
  icon: Icon,
  children,
}: ErrorComponentProps) => (
  <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
    {Icon && <Icon size={60} />}
    <h1 className="text-[7rem] leading-tight font-bold">{title}</h1>
    <span className="font-medium">{subTitle}</span>
    <p className="text-muted-foreground text-center capitalize">{description}</p>
    <div>{children}</div>
    <div className="mt-6 flex items-center gap-4">
      {!homeLinkDisabled && (
        <Button asChild size="lg">
          <Link href={routes.application.pages.home.path()}>
            <span className="text-nowrap">{common.errors.returnHome}</span>
          </Link>
        </Button>
      )}
      {externalNodes}
    </div>
  </div>
);
