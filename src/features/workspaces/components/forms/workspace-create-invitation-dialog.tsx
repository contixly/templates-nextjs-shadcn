"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconMailPlus } from "@tabler/icons-react";
import { Button } from "@components/ui/button";
import { CopyButton } from "@components/ui/custom/copy-button";
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
import { createWorkspaceInvitation } from "@features/workspaces/actions/create-workspace-invitation";
import {
  createWorkspaceInvitationFormSchema,
  type CreateWorkspaceInvitationInput,
} from "@features/workspaces/workspaces-invitations-schemas";
import type { WorkspaceInvitationDto } from "@features/workspaces/workspaces-invitations-types";
import type { WorkspaceManageableRole } from "@features/workspaces/workspaces-roles";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceCreateInvitationDialogProps {
  organizationId: string;
  assignableRoles: WorkspaceManageableRole[];
}

export const WorkspaceCreateInvitationDialog = ({
  organizationId,
  assignableRoles,
  trigger,
  ...props
}: WorkspaceCreateInvitationDialogProps & Partial<ModalProps>) => {
  const tCommon = useTranslations("common");
  const tWorkspaces = useTranslations("workspaces.ui.createInvitationDialog");
  const tRoles = useTranslations("workspaces.ui.roles.labels");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, onOpenChange] = useState(false);
  const [createdInvitation, setCreatedInvitation] = useState<WorkspaceInvitationDto | null>(null);
  const defaultRole = assignableRoles[0] ?? "member";

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<CreateWorkspaceInvitationInput>({
    resolver: zodResolver(createWorkspaceInvitationFormSchema(tAny)),
    mode: "all",
    defaultValues: {
      organizationId,
      email: "",
      role: defaultRole,
    },
  });

  const resetDialogState = () => {
    setCreatedInvitation(null);
    reset({
      organizationId,
      email: "",
      role: defaultRole,
    });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      resetDialogState();
    }
  };

  const submit: SubmitHandler<CreateWorkspaceInvitationInput> = (data) => {
    startTransition(async () => {
      const result = await createWorkspaceInvitation(data);

      if (result.success && result.data) {
        setCreatedInvitation(result.data);
        toast.success(tWorkspaces("success"));
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
      onOpenChange={handleOpenChange}
      title={tWorkspaces("title")}
      description={tWorkspaces("description")}
      trigger={
        trigger ?? (
          <Button size="sm">
            <IconMailPlus className="size-4" />
            {tWorkspaces("trigger")}
          </Button>
        )
      }
      {...props}
    >
      {createdInvitation ? (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">{tWorkspaces("createdTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {tWorkspaces("createdDescription")}
            </p>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="created-workspace-invitation-link">
                {tWorkspaces("linkLabel")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="created-workspace-invitation-link"
                  value={createdInvitation.invitationUrl}
                  readOnly
                />
                <CopyButton
                  text={createdInvitation.invitationUrl}
                  variant="outline"
                  copyLabel={tCommon("words.verbs.copy")}
                  copiedLabel={tWorkspaces("copied")}
                />
              </div>
            </Field>

            <Field orientation="horizontal" className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetDialogState}
                disabled={isPending}
              >
                {tWorkspaces("createAnother")}
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
                {tCommon("words.verbs.close")}
              </Button>
            </Field>
          </FieldGroup>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="workspace-invitation-email">
                    {tWorkspaces("emailLabel")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="workspace-invitation-email"
                    aria-invalid={fieldState.invalid}
                    placeholder={tWorkspaces("emailPlaceholder")}
                    disabled={isPending}
                    autoFocus
                    autoComplete="email"
                    inputMode="email"
                  />
                  <FieldDescription>{tWorkspaces("emailHint")}</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="workspace-invitation-role">
                    {tWorkspaces("roleLabel")}
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending || assignableRoles.length === 0}
                  >
                    <SelectTrigger
                      id="workspace-invitation-role"
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
                {tCommon("words.verbs.create")}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      )}
    </Modal>
  );
};
