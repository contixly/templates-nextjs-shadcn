"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  createDeleteWorkspaceFormSchema,
  DeleteWorkspaceInput,
} from "@features/workspaces/workspaces-schemas";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { deleteWorkspace } from "@features/workspaces/actions/delete-workspace";
import { useTranslations } from "next-intl";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import { LoadingButton } from "@components/ui/custom/button-loading";
import { FieldMessage } from "@components/ui/custom/field-message";
import { FormErrorNotice } from "@components/ui/custom/form-error-notice";

interface WorkspaceDeleteDialogProps {
  workspace: WorkspaceWithCounts | null;
  onSuccess?: () => void;
}

export const WorkspaceDeleteDialog = ({
  workspace,
  onSuccess,
  ...props
}: WorkspaceDeleteDialogProps & Partial<ModalProps>) => {
  const tCommon = useTranslations("common");
  const tWorkspaces = useTranslations("workspaces.ui.deleteDialog");
  const tAny = useAnyTranslations("workspaces");
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const defaultValues = useMemo(
    () => ({
      id: workspace?.id,
      name: workspace?.name ?? "",
      confirmationText: "",
    }),
    [workspace?.id, workspace?.name]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<DeleteWorkspaceInput>({
    resolver: zodResolver(createDeleteWorkspaceFormSchema(tAny)),
    mode: "all",
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
    }

    onOpenChange(nextOpen);
  };

  const submit: SubmitHandler<DeleteWorkspaceInput> = (data) => {
    if (!workspace?.id) return;

    startTransition(async () => {
      setFormError(null);
      const result = await deleteWorkspace(data);

      if (result.success) {
        toast.success(tWorkspaces("success"));
        handleOpenChange(false);
        onSuccess?.();
      } else {
        setFormError(
          translateWorkspaceErrorMessage(result.error?.message, tAny) ?? tWorkspaces("unknownError")
        );
      }
    });
  };

  if (!workspace) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={tWorkspaces("title")}
      description={tWorkspaces("description")}
      trigger={
        <Button type="button" variant="destructive">
          {tCommon("words.verbs.delete")}
        </Button>
      }
      {...props}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="confirmationText"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="delete-workspace-confirmation">
                  {tWorkspaces("confirmationLabel", { name: workspace.name })}
                </FieldLabel>
                <Input
                  {...field}
                  id="delete-workspace-confirmation"
                  aria-invalid={fieldState.invalid}
                  placeholder={tWorkspaces("confirmationPlaceholder")}
                  maxLength={50}
                  disabled={isPending}
                  autoFocus
                  autoComplete="off"
                  aria-describedby="delete-workspace-confirmation-message"
                />
                <FieldMessage
                  id="delete-workspace-confirmation-message"
                  errors={[fieldState.error]}
                />
              </Field>
            )}
          />

          {formError ? (
            <FormErrorNotice title={tWorkspaces("errorTitle")}>{formError}</FormErrorNotice>
          ) : null}

          <Field orientation="horizontal" className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              {tCommon("words.verbs.cancel")}
            </Button>
            <LoadingButton
              type="submit"
              variant="destructive"
              loading={isPending}
              disabled={isPending || !isDirty || !isValid}
            >
              {tCommon("words.verbs.delete")}
            </LoadingButton>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
};
