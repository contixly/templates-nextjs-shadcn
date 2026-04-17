"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  createDeleteWorkspaceFormSchema,
  DeleteWorkspaceInput,
} from "@features/workspaces/workspaces-schemas";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { deleteWorkspace } from "@features/workspaces/actions/delete-workspace";
import { Spinner } from "@components/ui/spinner";
import { useTranslations } from "next-intl";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";

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

  const submit: SubmitHandler<DeleteWorkspaceInput> = (data) => {
    if (!workspace?.id) return;

    startTransition(async () => {
      const result = await deleteWorkspace(data);

      if (result.success) {
        toast.success(tWorkspaces("success"));
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(tWorkspaces("errorTitle"), {
          description:
            translateWorkspaceErrorMessage(result.error?.message, tAny) ??
            tWorkspaces("unknownError"),
        });
      }
    });
  };

  if (!workspace) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
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
          {workspace.isDefault ? (
            <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4">
              <p className="text-sm font-medium">{workspace.name}</p>
              <p className="text-muted-foreground mt-2 text-sm">
                {tWorkspaces("defaultWorkspaceNotice")}
              </p>
            </div>
          ) : null}

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
