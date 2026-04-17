"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createDeleteAccountFormSchema,
  DeleteAccountInput,
} from "@features/accounts/accounts-schemas";
import { Button } from "@components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { Spinner } from "@components/ui/spinner";
import { IconAlertTriangle } from "@tabler/icons-react";
import { toast } from "sonner";
import routes from "@features/routes";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@features/accounts/actions/delete-account";
import { useTranslations } from "next-intl";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";
import { translateAccountErrorMessage } from "@features/accounts/accounts-errors";

export const AccountDeleteDialog = ({
  email,
  ...props
}: Partial<ModalProps> & {
  email: string;
}) => {
  const tCommon = useTranslations("common");
  const tAccounts = useTranslations("accounts.ui.deleteDialog");
  const tAny = useAnyTranslations("accounts");
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const router = useRouter();

  const schema = useMemo(() => createDeleteAccountFormSchema(email, tAny), [email, tAny]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<DeleteAccountInput>({
    resolver: zodResolver(schema),
    mode: "all",
    defaultValues: {
      confirmEmail: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const submit: SubmitHandler<DeleteAccountInput> = (data) => {
    startTransition(async () => {
      const result = await deleteAccount(data);

      if (result.success) {
        toast.success(tAccounts("success"));
        onOpenChange(false);
        router.push(routes.application.pages.home.path());
      } else {
        toast.error(tAccounts("errorTitle"), {
          description:
            translateAccountErrorMessage(result.error?.message, tAny) ?? tAccounts("unknownError"),
        });
      }
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tAccounts("title")}
      description={tAccounts("description")}
      trigger={
        <Button type="button" variant="destructive">
          {tCommon("words.verbs.delete")}
        </Button>
      }
      {...props}
    >
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
        <div className="flex gap-3">
          <IconAlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="text-destructive font-medium">{tAccounts("warningTitle")}</p>
            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1">
              <li>{tAccounts("warningData")}</li>
              <li>{tAccounts("warningProviders")}</li>
              <li>{tAccounts("warningSessions")}</li>
              <li>{tAccounts("warningIrreversible")}</li>
            </ul>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="confirmEmail"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="delete-account-confirmation">
                  {tAccounts("confirmationLabel", { email })}
                </FieldLabel>
                <Input
                  {...field}
                  id="delete-account-confirmation"
                  aria-invalid={fieldState.invalid}
                  placeholder={tAccounts("confirmationPlaceholder")}
                  maxLength={50}
                  disabled={isPending}
                  autoFocus
                  autoComplete="off"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Field orientation="horizontal" className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("words.verbs.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !isDirty || !isValid}
            >
              {isPending && <Spinner data-icon="inline-start" />}
              {tCommon("words.verbs.delete")}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
};
