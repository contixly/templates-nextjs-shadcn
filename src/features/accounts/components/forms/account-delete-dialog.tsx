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
import common from "@messages/common.json";
import { IconAlertTriangle } from "@tabler/icons-react";
import { toast } from "sonner";
import routes from "@features/routes";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@features/accounts/actions/delete-account";

export const AccountDeleteDialog = ({
  email,
  ...props
}: Partial<ModalProps> & {
  email: string;
}) => {
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const router = useRouter();

  const schema = useMemo(() => createDeleteAccountFormSchema(email), [email]);

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
        toast.success("Workspace deleted successfully");
        onOpenChange(false);
        router.push(routes.application.pages.home.path());
      } else {
        toast.error("Delete Workspace", {
          description: result.error?.message ?? "Unknown error",
        });
      }
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Account?"
      description="This action cannot be undone. This will permanently delete your account and remove all
associated data from our servers."
      trigger={
        <Button type="button" variant="destructive">
          {common.words.verbs.delete}
        </Button>
      }
      {...props}
    >
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
        <div className="flex gap-3">
          <IconAlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" />
          <div className="text-sm">
            <p className="text-destructive font-medium">Warning</p>
            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1">
              <li>All your data will be permanently deleted</li>
              <li>Your connected accounts will be unlinked</li>
              <li>Your active sessions will be terminated</li>
              <li>This action cannot be reversed</li>
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
                  To confirm, please type “{email}” below in the box below
                </FieldLabel>
                <Input
                  {...field}
                  id="delete-workspace-confirmation"
                  aria-invalid={fieldState.invalid}
                  placeholder="Type email to confirm deletion"
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
              {common.words.verbs.cancel}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || !isDirty || !isValid}
            >
              {isPending && <Spinner data-icon="inline-start" />}
              {common.words.verbs.delete}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
};
