"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconSettings } from "@tabler/icons-react";
import { toast } from "sonner";
import React, { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  createUpdateWorkspaceFormSchema,
  UpdateWorkspaceInput,
} from "@features/workspaces/workspaces-schemas";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { updateWorkspace } from "@features/workspaces/actions/update-workspace";
import { Spinner } from "@components/ui/spinner";
import common from "@messages/common.json";

interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithCounts | null;
  onSuccess?: () => void;
  canChangeDefault?: boolean;
}

export function WorkspaceSettingsDialog({
  workspace,
  onSuccess,
  canChangeDefault,
  ...props
}: WorkspaceSettingsDialogProps & Partial<ModalProps>) {
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const defaultValues = useMemo(
    () => ({
      id: workspace?.id,
      name: workspace?.name ?? "",
      isDefault: workspace?.isDefault ?? false,
    }),
    [workspace?.id, workspace?.isDefault, workspace?.name]
  );

  const formSchema = useMemo(
    () => createUpdateWorkspaceFormSchema(workspace?.name ?? ""),
    [workspace?.name]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues,
  });

  useEffect(() => {
    // Keep the form state in sync when the dialog is closed; avoid clobbering edits while open.
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const submit: SubmitHandler<UpdateWorkspaceInput> = (data) => {
    if (!workspace) return;

    startTransition(async () => {
      const result = await updateWorkspace(data);

      if (result.success) {
        toast.success("Workspace updated successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error("Update Workspace", {
          description: result.error?.message ?? "Unknown error",
        });
      }
    });
  };

  if (!workspace) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Workspace Settings"
      description="Modify the workspace settings or delete the workspace."
      trigger={
        <Button variant="ghost" size="icon">
          <IconSettings className="size-4" />
          <span className="sr-only">Settings</span>
        </Button>
      }
      {...props}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FieldGroup>
          <FieldGroup>
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-workspace-name">Workspace Name</FieldLabel>
                  <Input
                    {...field}
                    id="edit-workspace-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="e.g., Work, Personal, Projects"
                    maxLength={50}
                    disabled={isPending}
                    autoFocus
                    autoComplete="off"
                  />
                  <FieldDescription className="text-xs">Maximum 50 characters</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="isDefault"
              control={control}
              render={({ field, fieldState }) => (
                <FieldGroup data-slot="checkbox-group">
                  <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                    <Checkbox
                      id="edit-is-default"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending || !canChangeDefault}
                    />
                    <FieldLabel
                      htmlFor="edit-is-default"
                      className="cursor-pointer text-sm font-normal"
                    >
                      Set as default workspace
                    </FieldLabel>
                  </Field>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldGroup>
              )}
            />
          </FieldGroup>

          <Field orientation="horizontal" className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {common.words.verbs.cancel}
            </Button>
            <Button type="submit" disabled={isPending || !isDirty || !isValid}>
              {isPending && <Spinner data-icon="inline-start" />}
              {common.words.verbs.save}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
}
