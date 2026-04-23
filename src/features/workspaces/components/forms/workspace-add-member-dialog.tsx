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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Spinner } from "@components/ui/spinner";
import { addWorkspaceMember } from "@features/workspaces/actions/add-workspace-member";
import {
  addWorkspaceMemberFormSchema,
  type AddWorkspaceMemberInput,
} from "@features/workspaces/workspaces-invitations-schemas";
import type { WorkspaceManageableRole } from "@features/workspaces/workspaces-roles";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceAddMemberDialogProps {
  organizationId: string;
  assignableRoles: WorkspaceManageableRole[];
}

export const WorkspaceAddMemberDialog = ({
  organizationId,
  assignableRoles,
  trigger,
  ...props
}: WorkspaceAddMemberDialogProps & Partial<ModalProps>) => {
  const tCommon = useTranslations("common");
  const tWorkspaces = useTranslations("workspaces.ui.addMemberDialog");
  const tRoles = useTranslations("workspaces.ui.roles.labels");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const defaultRole = assignableRoles[0] ?? "member";

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
      role: defaultRole,
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        organizationId,
        userId: "",
        role: defaultRole,
      });
    }
  }, [defaultRole, open, organizationId, reset]);

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

          <Controller
            name="role"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="workspace-add-member-role">
                  {tWorkspaces("roleLabel")}
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending || assignableRoles.length === 0}
                >
                  <SelectTrigger
                    id="workspace-add-member-role"
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {tRoles(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>{tWorkspaces("roleHint")}</FieldDescription>
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
