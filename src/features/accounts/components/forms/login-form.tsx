"use client";

import { cn } from "@lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Field, FieldDescription } from "@components/ui/field";
import React, { Suspense, use, useState } from "react";
import { Spinner } from "@components/ui/spinner";
import { socialsProviders } from "@typings/auth";
import { ProviderButton } from "@features/accounts/components/ui/provider-button";
import { useTranslations } from "next-intl";

interface LoginFormProps extends React.ComponentProps<"div"> {
  getLastLoginPromise: Promise<string | undefined | null>;
}

const LoginFormComponent = ({ getLastLoginPromise }: LoginFormProps) => {
  const lastMethod = use(getLastLoginPromise);
  const [isPending, setIsPending] = useState(false);

  return (
    <>
      {isPending && (
        <div className="flex flex-1 flex-col items-center justify-center">
          <Spinner className="size-10" />
        </div>
      )}
      {!isPending && (
        <Field className="flex-1 items-center justify-center gap-4">
          {socialsProviders.map((provider) => (
            <ProviderButton
              key={provider.id}
              provider={provider}
              lastMethod={lastMethod}
              isPending={isPending}
              setIsPending={setIsPending}
            />
          ))}
        </Field>
      )}
    </>
  );
};

export const LoginForm = ({ className, ...props }: LoginFormProps) => {
  const t = useTranslations("accounts.ui.loginForm");

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card className="min-h-96">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <Suspense>
            <LoginFormComponent {...props} />
          </Suspense>
        </CardContent>
        <CardFooter className="mt-auto">
          <Field>
            <FieldDescription className="grid gap-2 text-center">
              <span>{t("noAccountTitle")}</span>
              <span>{t("noAccountDescription")}</span>
            </FieldDescription>
          </Field>
        </CardFooter>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t("termsPrefix")} <a href="#">{t("termsOfService")}</a> and{" "}
        <a href="#">{t("privacyPolicy")}</a>.
      </FieldDescription>
    </div>
  );
};
