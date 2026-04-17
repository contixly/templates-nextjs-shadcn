import { Button, buttonVariants } from "@components/ui/button";
import { SocialProvider } from "@typings/auth";
import React, { Dispatch, SetStateAction, startTransition, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@components/ui/badge";
import { signIn } from "@lib/auth-client";
import type { VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";

export const ProviderButton = ({
  provider,
  lastMethod,
  setIsPending,
  isPending,
  redirectTo,
  ...props
}: {
  provider: SocialProvider;
  lastMethod?: string | undefined | null;
  isPending?: boolean;
  setIsPending?: Dispatch<SetStateAction<boolean>>;
  redirectTo?: string;
} & React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) => {
  const t = useTranslations("accounts.ui.providerButton");
  const redirect: string | null = useSearchParams().get("redirect");
  const isLast = provider.id === lastMethod;

  const signInCallback = useCallback(() => {
    startTransition(async () => {
      setIsPending?.(true);

      signIn(provider.id, redirectTo ?? redirect, provider.type).finally(() =>
        setTimeout(() => setIsPending?.(false), 5000)
      );
    });
  }, [provider.id, provider.type, redirect, redirectTo, setIsPending]);

  return (
    <div className="relative" key={provider.id}>
      <Button
        disabled={isPending}
        type="button"
        className="w-full"
        variant="outline"
        onClick={signInCallback}
        {...props}
      >
        {provider.icon && <provider.icon className="mr-2" />}
        {t("loginWith", { provider: provider.name })}
      </Button>
      {lastMethod && isLast && <Badge className="absolute -top-2 -right-2">{t("lastUsed")}</Badge>}
    </div>
  );
};
