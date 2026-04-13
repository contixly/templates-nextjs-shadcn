import common from "@messages/common.json";
import { IconKey } from "@tabler/icons-react";
import React from "react";
import { ErrorComponent, ErrorComponentProps } from "@components/errors/error-component";

export const NotLogged = (props: ErrorComponentProps) => (
  <ErrorComponent
    icon={IconKey}
    subTitle={common.errors.notLogged.subTitle}
    description={common.errors.notLogged.description}
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
