import { IconKey } from "@tabler/icons-react";
import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";
import { useTranslations } from "next-intl";

export const NotLogged = (props: ErrorComponentProps) => {
  const t = useTranslations("common");

  return (
    <ErrorComponent
      icon={IconKey}
      subTitle={t("errors.notLogged.subTitle")}
      description={t("errors.notLogged.description")}
      // TODO
      // externalNodes={
      //   <SignedOut>
      //     <SignInButton>
      //       <Button>SignIn</Button>
      //     </SignInButton>
      //   </SignedOut>
      // }
      homeLinkDisabled
      backLinkDisabled
      {...props}
    />
  );
};
