"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconUserPlus } from "@tabler/icons-react";
import { Button } from "@components/ui/button";
import { Modal, type ModalProps } from "@components/ui/custom/modal";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { Spinner } from "@components/ui/spinner";
import { addWorkspaceMember } from "@features/workspaces/actions/add-workspace-member";
import {
  addWorkspaceMemberFormSchema,
  type AddWorkspaceMemberInput,
} from "@features/workspaces/workspaces-invitations-schemas";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceAddMemberDialogProps {
  organizationId: string;
}

export const WorkspaceAddMemberDialog = ({
  organizationId,
  trigger,
  ...props
}: WorkspaceAddMemberDialogProps & Partial<ModalProps>) => {
  const tCommon = useTranslations("common");
  const tWorkspaces = useTranslations("workspaces.ui.addMemberDialog");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<AddWorkspaceMemberInput>({
    resolver: zodResolver(addWorkspaceMemberFormSchema(tAny)),
    mode: "all",
    defaultValues: {
      organizationId,
      userId: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        organizationId,
        userId: "",
      });
    }
  }, [open, organizationId, reset]);

  const submit: SubmitHandler<AddWorkspaceMemberInput> = (data) => {
    startTransition(async () => {
      const result = await addWorkspaceMember(data);

      if (result.success) {
        toast.success(tWorkspaces("success"));
        onOpenChange(false);
        router.refresh();
        return;
      }

      toast.error(tWorkspaces("errorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ??
          tWorkspaces("unknownError"),
      });
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tWorkspaces("title")}
      description={tWorkspaces("description")}
      trigger={
        trigger ?? (
          <Button size="sm" variant="outline">
            <IconUserPlus className="size-4" />
            {tWorkspaces("trigger")}
          </Button>
        )
      }
      {...props}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FieldGroup>
          <Controller
            name="userId"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-add-member-user-id">
                  {tWorkspaces("userIdLabel")}
                </FieldLabel>
                <Input
                  {...field}
                  id="workspace-add-member-user-id"
                  aria-invalid={fieldState.invalid}
                  placeholder={tWorkspaces("userIdPlaceholder")}
                  disabled={isPending}
                  autoFocus
                  autoComplete="off"
                />
                <FieldDescription>{tWorkspaces("userIdHint")}</FieldDescription>
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
            <Button type="submit" disabled={isPending || !isDirty || !isValid}>
              {isPending && <Spinner data-icon="inline-start" />}
              {tCommon("words.verbs.add")}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
};
