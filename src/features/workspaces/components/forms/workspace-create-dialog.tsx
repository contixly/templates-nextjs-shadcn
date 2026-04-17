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
  createWorkspaceFormSchema,
} from "@features/workspaces/workspaces-schemas";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { IconPlus } from "@tabler/icons-react";
import { createWorkspace } from "@features/workspaces/actions/create-workspace";
import { Spinner } from "@components/ui/spinner";
import { useTranslations } from "next-intl";
import { cn } from "@lib/utils";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";

interface CreateWorkspaceDialogProps {
  onSuccess?: DispatchWithoutAction;
}

export const WorkspaceCreateDialog = ({
  onSuccess,
  trigger,
  ...props
}: CreateWorkspaceDialogProps & Partial<ModalProps>) => {
  const tCommon = useTranslations("common");
  const tWorkspaces = useTranslations("workspaces.ui.createDialog");
  const tAny = useAnyTranslations("workspaces");
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const localizedTrigger =
    trigger && React.isValidElement<{ className?: string }>(trigger)
      ? React.cloneElement(trigger, {
          className: cn(
            "h-auto min-h-12 py-2 [&>span:last-child]:overflow-visible [&>span:last-child]:text-clip [&>span:last-child]:whitespace-normal",
            trigger.props.className
          ),
        })
      : trigger;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceFormSchema(tAny)),
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

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tWorkspaces("title")}
      description={tWorkspaces("description")}
      trigger={
        localizedTrigger ?? (
          <Button size="lg">
            <IconPlus className="mr-2 size-5" />
            {tWorkspaces("trigger")}
          </Button>
        )
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
                  <FieldLabel htmlFor="workspace-name">{tWorkspaces("nameLabel")}</FieldLabel>
                  <Input
                    {...field}
                    id="workspace-name"
                    aria-invalid={fieldState.invalid}
                    placeholder={tWorkspaces("namePlaceholder")}
                    maxLength={50}
                    disabled={isPending}
                    autoFocus
                    autoComplete="off"
                  />
                  <FieldDescription className="text-xs">{tWorkspaces("nameHint")}</FieldDescription>
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
                      {tWorkspaces("defaultLabel")}
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
              {tCommon("words.verbs.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !isDirty || !isValid}>
              {isPending && <Spinner data-icon="inline-start" />}
              {tCommon("words.verbs.create")}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
};
