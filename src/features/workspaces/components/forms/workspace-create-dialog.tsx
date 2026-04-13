"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import React, { DispatchWithoutAction, useEffect, useState, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  CreateWorkspaceInput,
  createWorkspaceSchema,
} from "@features/workspaces/workspaces-schemas";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { IconPlus } from "@tabler/icons-react";
import { createWorkspace } from "@features/workspaces/actions/create-workspace";
import { Spinner } from "@components/ui/spinner";
import common from "@messages/common.json";

interface CreateWorkspaceDialogProps {
  onSuccess?: DispatchWithoutAction;
}

export const WorkspaceCreateDialog = ({
  onSuccess,
  ...props
}: CreateWorkspaceDialogProps & Partial<ModalProps>) => {
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    mode: "all",
    defaultValues: {
      name: "",
      isDefault: false,
    },
  });

  const submit: SubmitHandler<CreateWorkspaceInput> = (data) => {
    startTransition(async () => {
      const result = await createWorkspace(data);

      if (result.success) {
        toast.success("Workspace created successfully");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error("Create New Workspace", {
          description: result.error?.message ?? "Unknown error",
        });
      }
    });
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Create New Workspace"
      description="Create a workspace to isolate data or contexts for your product (teams, clients, environments)."
      trigger={
        <Button size="lg">
          <IconPlus className="mr-2 size-5" />
          Create New Workspace
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
                  <FieldLabel htmlFor="workspace-name">Workspace Name</FieldLabel>
                  <Input
                    {...field}
                    id="workspace-name"
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
                      id="is-default"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                    <FieldLabel htmlFor="is-default" className="cursor-pointer text-sm font-normal">
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
              {common.words.verbs.create}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
};
