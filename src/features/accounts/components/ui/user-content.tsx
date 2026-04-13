import { User } from "better-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { accountsTools } from "@features/accounts/accounts-tools";
import * as React from "react";

export const UserContent = ({ user }: { user: User }) => {
  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        {user.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback className="bg-sidebar rounded-lg">
          {accountsTools.getInitials(user.name) ?? "CN"}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="text-muted-foreground truncate text-xs">{user.email}</span>
      </div>
    </>
  );
};
