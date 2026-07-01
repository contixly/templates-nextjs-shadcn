"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/alert-dialog";
import { LoadingButton } from "@components/ui/custom/button-loading";
import { FormErrorNotice } from "@components/ui/custom/form-error-notice";
import { useTranslations } from "next-intl";
import { deleteApiKeyForCurrentUser } from "@features/api-keys/actions/delete-api-key";
import {
  type ApiKeyTranslationFn,
  translateApiKeyErrorMessage,
} from "@features/api-keys/components/api-key-component-utils";
import type { ApiKeyListItemDto, ApiKeyOwnerType } from "@features/api-keys/api-keys-types";

interface ApiKeyDeleteControlProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  organizationKey?: string;
  apiKey: Pick<ApiKeyListItemDto, "id" | "name" | "start">;
  trigger: ReactElement;
}

export function ApiKeyDeleteControl({
  ownerType,
  organizationId,
  organizationKey,
  apiKey,
  trigger,
}: ApiKeyDeleteControlProps) {
  const t = useTranslations("apiKeys.ui") as unknown as ApiKeyTranslationFn;
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const keyName = apiKey.name ?? apiKey.start ?? apiKey.id;

  const handleDelete = () => {
    startTransition(async () => {
      setError(null);
      const result = await deleteApiKeyForCurrentUser({
        type: ownerType,
        organizationId,
        organizationKey,
        keyId: apiKey.id,
      });

      if (result.success) {
        toast.success(t("form.deleteSuccess"));
        setOpen(false);
        router.refresh();
        return;
      }

      setError(translateApiKeyErrorMessage(result.error?.message, t));
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setError(null);
    }

    setOpen(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("form.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("form.deleteDescription", { name: keyName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <FormErrorNotice title={t("form.errorTitle")}>{error}</FormErrorNotice> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tCommon("words.verbs.cancel")}
          </AlertDialogCancel>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={isPending}
            disabled={isPending}
            onClick={handleDelete}
          >
            {tCommon("words.verbs.delete")}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
