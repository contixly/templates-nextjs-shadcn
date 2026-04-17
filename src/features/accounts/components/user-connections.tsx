"use client";

import React, { startTransition, Suspense, use, useCallback, useState } from "react";
import { Account } from "better-auth";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { SocialProvider, socialsProviders } from "@typings/auth";
import { Badge } from "@components/ui/badge";
import { timeTools } from "@lib/time";
import { Button } from "@components/ui/button";
import { IconLink, IconUnlink } from "@tabler/icons-react";
import { authClient } from "@lib/auth-client";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@components/ui/item";
import { Skeleton } from "@components/ui/skeleton";
import routes from "@features/routes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

interface UserConnectionsProps {
  loadCurrentUserAccountsPromise: Promise<Account[] | undefined>;
  getLastLoginPromise: Promise<string | undefined | null>;
}

const UserConnectionsComponent = ({
  loadCurrentUserAccountsPromise,
  getLastLoginPromise,
}: UserConnectionsProps) => {
  const t = useTranslations("accounts.ui.connections");
  const locale = useLocale();
  const accounts = use(loadCurrentUserAccountsPromise);
  const lastMethod = use(getLastLoginPromise);
  const canUnlink = accounts && accounts.length > 1;
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const finallyCallback = useCallback((delay: number = 5000) => {
    setTimeout(() => {
      setIsPending(false);
    }, delay);
  }, []);

  const handleUnlink = (provider: SocialProvider) =>
    startTransition(() => {
      setIsPending(true);

      authClient
        .unlinkAccount({ providerId: provider.id })
        .then(router.refresh)
        .then(() => toast.success(t("unlinkSuccess")))
        .catch((error) =>
          toast.error(t("unlinkErrorTitle"), {
            description: error?.message ?? t("unknownError"),
          })
        )
        .finally(() => finallyCallback(1000));
    });

  const handleLink = (provider: SocialProvider) =>
    startTransition(() => {
      setIsPending(true);

      const action: Promise<void> =
        provider.type === "default"
          ? authClient.linkSocial({
              provider: provider.id,
              callbackURL: routes.accounts.pages.connections.path(),
            })
          : provider.type === "oauth2"
            ? // @ts-expect-error unknow method
              authClient.oauth2.link({
                providerId: provider.id,
                callbackURL: routes.accounts.pages.connections.path(),
              })
            : Promise.resolve();

      action
        .catch((error) =>
          toast.error(t("linkErrorTitle"), {
            description: error?.message ?? t("unknownError"),
          })
        )
        .finally(finallyCallback);
    });

  return (
    <ItemGroup>
      {socialsProviders?.map((provider) => {
        const isLastUsed = lastMethod === provider.id;
        const account = accounts?.find((a) => a.providerId === provider.id);

        return (
          <Item key={provider.id} variant="outline" className="rounded-lg px-4 py-4 text-sm">
            <ItemMedia className="bg-muted size-10 rounded-full">
              {provider?.icon && <provider.icon className="size-5" />}
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="text-sm">
                {provider?.name}
                {isLastUsed && <Badge variant="secondary">{t("lastUsed")}</Badge>}
              </ItemTitle>
              {account?.createdAt && (
                <ItemDescription className="text-sm">
                  {t("connectedOn", { date: timeTools.formatDate(account.createdAt, locale) })}
                </ItemDescription>
              )}
              {!account?.createdAt && (
                <ItemDescription className="text-sm">{t("notConnected")}</ItemDescription>
              )}
            </ItemContent>
            <ItemActions className="ml-auto">
              {account && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canUnlink || isPending || isLastUsed}
                  onClick={() => handleUnlink(provider)}
                  className="w-32"
                >
                  <IconUnlink className="mr-2 size-4" />
                  {t("disconnect")}
                </Button>
              )}
              {!account && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleLink(provider)}
                  className="w-32"
                >
                  <IconLink className="mr-2 size-4" />
                  {t("connect")}
                </Button>
              )}
            </ItemActions>
          </Item>
        );
      })}
    </ItemGroup>
  );
};

const UserConnectionsFallback = () => (
  <ItemGroup>
    {socialsProviders?.map((provider) => (
      <Item key={provider.id} variant="outline" className="rounded-lg px-4 py-4">
        <ItemMedia className="size-10">
          <Skeleton className="size-10 rounded-full" />
        </ItemMedia>
        <ItemContent className="gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-44" />
        </ItemContent>
        <ItemActions className="ml-auto">
          <Skeleton className="h-9 w-32" />
        </ItemActions>
      </Item>
    ))}
  </ItemGroup>
);

export const UserConnections = (props: UserConnectionsProps) => {
  const t = useTranslations("accounts.ui.connections");

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {t("loadError", {
                message: error instanceof Error ? error.message : t("unknownError"),
              })}
            </p>
          </CardContent>
        </Card>
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<UserConnectionsFallback />}>
            <UserConnectionsComponent {...props} />
          </Suspense>
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};
