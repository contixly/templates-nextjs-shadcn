"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import React, { useEffect, useMemo, useTransition } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import { Spinner } from "@components/ui/spinner";
import { Textarea } from "@components/ui/textarea";
import { updateWorkspace } from "@features/workspaces/actions/update-workspace";
import { getWorkspaceAllowedEmailDomains } from "@features/workspaces/workspaces-domain-restrictions";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import {
  createUpdateWorkspaceFormSchema,
  UpdateWorkspaceInput,
} from "@features/workspaces/workspaces-schemas";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceSettingsFormProps {
  workspace: WorkspaceWithCounts;
  canUpdateWorkspace?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  autoFocusNameField?: boolean;
}

const getDefaultValues = (workspace: WorkspaceWithCounts): UpdateWorkspaceInput => ({
  id: workspace.id,
  name: workspace.name,
  slug: workspace.slug ?? "",
  allowedEmailDomains: getWorkspaceAllowedEmailDomains(workspace.metadata),
});

const parseAllowedEmailDomainsText = (value: string) =>
  value
    .split(/[\n,]+/)
    .map((domain) => domain.trim())
    .filter(Boolean);

export const WorkspaceSettingsForm = ({
  workspace,
  canUpdateWorkspace = true,
  onSuccess,
  onCancel,
  showCancelButton = false,
  autoFocusNameField = false,
}: WorkspaceSettingsFormProps) => {
  const tCommon = useTranslations("common");
  const tWorkspaces = useTranslations("workspaces.ui.settingsForm");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const defaultValues = useMemo(() => getDefaultValues(workspace), [workspace]);
  const formSchema = useMemo(
    () => createUpdateWorkspaceFormSchema(workspace.name, tAny),
    [workspace.name, tAny]
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
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submit: SubmitHandler<UpdateWorkspaceInput> = (data) => {
    startTransition(async () => {
      const result = await updateWorkspace(data);

      if (result.success) {
        if (result.data) {
          reset(getDefaultValues(result.data));
        }

        toast.success(tWorkspaces("success"));
        onSuccess?.();
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
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <FieldGroup>
        <FieldGroup>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-workspace-name">{tWorkspaces("nameLabel")}</FieldLabel>
                <Input
                  {...field}
                  id="edit-workspace-name"
                  aria-invalid={fieldState.invalid}
                  placeholder={tWorkspaces("namePlaceholder")}
                  maxLength={50}
                  disabled={isPending || !canUpdateWorkspace}
                  autoFocus={autoFocusNameField}
                  autoComplete="off"
                />
                <FieldDescription className="text-xs">{tWorkspaces("nameHint")}</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="slug"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-workspace-slug">{tWorkspaces("slugLabel")}</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id="edit-workspace-slug"
                  aria-invalid={fieldState.invalid}
                  placeholder={tWorkspaces("slugPlaceholder")}
                  maxLength={50}
                  disabled={isPending || !canUpdateWorkspace}
                  autoComplete="off"
                />
                <FieldDescription className="text-xs">{tWorkspaces("slugHint")}</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="allowedEmailDomains"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-workspace-allowed-email-domains">
                  {tWorkspaces("allowedEmailDomainsLabel")}
                </FieldLabel>
                <Textarea
                  id="edit-workspace-allowed-email-domains"
                  value={(field.value ?? []).join("\n")}
                  onChange={(event) =>
                    field.onChange(parseAllowedEmailDomainsText(event.target.value))
                  }
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  placeholder={tWorkspaces("allowedEmailDomainsPlaceholder")}
                  disabled={isPending || !canUpdateWorkspace}
                  autoComplete="off"
                  rows={4}
                />
                <FieldDescription className="text-xs">
                  {tWorkspaces("allowedEmailDomainsHint")}
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Field orientation="horizontal" className="flex justify-end gap-2">
          {showCancelButton && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              {tCommon("words.verbs.cancel")}
            </Button>
          )}
          {canUpdateWorkspace ? (
            <Button
              type="submit"
              disabled={isPending || !isDirty || !isValid}
              className="min-w-fit"
            >
              {isPending && <Spinner data-icon="inline-start" />}
              {tCommon("words.verbs.save")}
            </Button>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
};
