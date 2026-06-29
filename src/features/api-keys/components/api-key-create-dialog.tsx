"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { LoadingButton } from "@components/ui/custom/button-loading";
import { CopyButton } from "@components/ui/custom/copy-button";
import { FieldMessage } from "@components/ui/custom/field-message";
import { FormErrorNotice } from "@components/ui/custom/form-error-notice";
import { Modal } from "@components/ui/custom/modal";
import { Field, FieldContent, FieldGroup, FieldLabel, FieldTitle } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Switch } from "@components/ui/switch";
import { createApiKeyForCurrentUser } from "@features/api-keys/actions/create-api-key";
import {
  API_KEY_EXPIRATION_OPTIONS,
  API_KEY_RATE_LIMIT_WINDOW_OPTIONS,
  apiKeyCreateFormSchema,
  type ApiKeyCreateFormInput,
} from "@features/api-keys/api-keys-schemas";
import {
  apiKeyPermissionPresetOptions,
  expandApiKeyPresetIds,
} from "@features/api-keys/api-keys-permissions";
import {
  translateApiKeyErrorMessage,
  translatedFieldError,
} from "@features/api-keys/components/api-key-component-utils";
import { ApiKeyPermissionsPreview } from "@features/api-keys/components/api-key-permissions-preview";
import type { ApiKeyDisplayData, ApiKeyOwnerType } from "@features/api-keys/api-keys-types";

interface ApiKeyCreateDialogProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  organizationKey?: string;
  trigger: ReactElement;
}

const getDefaultPresetIds = (ownerType: ApiKeyOwnerType) =>
  ownerType === "organization" ? ["organization-read-all" as const] : ["basic-read" as const];

export function ApiKeyCreateDialog({
  ownerType,
  organizationId,
  organizationKey,
  trigger,
}: ApiKeyCreateDialogProps) {
  const t = useTranslations("apiKeys.ui");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<ApiKeyDisplayData | null>(null);

  const defaultValues = useMemo<ApiKeyCreateFormInput>(
    () => ({
      type: ownerType,
      organizationId,
      organizationKey,
      name: "",
      presetIds: getDefaultPresetIds(ownerType),
      expiresIn: "30d",
      rateLimitEnabled: true,
      rateLimitMax: 1000,
      rateLimitWindow: "1h",
    }),
    [organizationId, organizationKey, ownerType]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<ApiKeyCreateFormInput>({
    resolver: zodResolver(apiKeyCreateFormSchema),
    mode: "all",
    defaultValues,
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setFormError(null);
      setCreatedKey(null);
    }

    setOpen(nextOpen);
  };

  const submit: SubmitHandler<ApiKeyCreateFormInput> = (data) => {
    startTransition(async () => {
      setFormError(null);
      const result = await createApiKeyForCurrentUser(data);

      if (result.success && result.data) {
        setCreatedKey(result.data);
        toast.success(t("form.createSuccess"));
        router.refresh();
        return;
      }

      setFormError(translateApiKeyErrorMessage(result.error?.message, t));
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={t("form.createTitle")}
      description={createdKey ? t("form.secretDescription") : t("form.createDescription")}
      trigger={trigger}
      className="sm:min-w-xl"
    >
      {createdKey ? (
        <div className="space-y-4">
          <Field>
            <FieldLabel htmlFor="created-api-key-secret">{t("form.secretTitle")}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="created-api-key-secret"
                value={createdKey.key}
                readOnly
                className="font-mono"
              />
              <CopyButton
                type="button"
                variant="outline"
                text={createdKey.key}
                copyLabel={t("form.copySecret")}
                copiedLabel={t("form.copiedSecret")}
              />
            </div>
            <FieldMessage description={t("form.secretDescription")} />
          </Field>
          <Field orientation="horizontal" className="justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {tCommon("words.verbs.close")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setCreatedKey(null);
                reset(defaultValues);
              }}
            >
              {t("form.createAnother")}
            </Button>
          </Field>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <FieldGroup>
            <ApiKeyCreateFields control={control} disabled={isPending} t={t} />

            {formError ? (
              <FormErrorNotice title={t("form.errorTitle")}>{formError}</FormErrorNotice>
            ) : null}

            <Field orientation="horizontal" className="justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                {tCommon("words.verbs.cancel")}
              </Button>
              <LoadingButton
                type="submit"
                loading={isPending}
                disabled={isPending || !isDirty || !isValid}
              >
                {tCommon("words.verbs.create")}
              </LoadingButton>
            </Field>
          </FieldGroup>
        </form>
      )}
    </Modal>
  );
}

function ApiKeyCreateFields({
  control,
  disabled,
  t,
}: {
  control: ReturnType<typeof useForm<ApiKeyCreateFormInput>>["control"];
  disabled: boolean;
  t: (key: string) => string;
}) {
  return (
    <>
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="create-api-key-name">{t("form.nameLabel")}</FieldLabel>
            <Input
              {...field}
              id="create-api-key-name"
              aria-invalid={fieldState.invalid}
              placeholder={t("form.namePlaceholder")}
              maxLength={32}
              autoComplete="off"
              disabled={disabled}
              autoFocus
            />
            <FieldMessage
              description={t("form.nameHint")}
              errors={[translatedFieldError(fieldState.error?.message, t)]}
            />
          </Field>
        )}
      />

      <PresetSelector control={control} disabled={disabled} t={t} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Controller
          name="expiresIn"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("form.expirationLabel")}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_EXPIRATION_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`expiration.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldMessage errors={[translatedFieldError(fieldState.error?.message, t)]} />
            </Field>
          )}
        />
        <Controller
          name="rateLimitMax"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="create-api-key-rate-limit-max">
                {t("form.rateLimitMaxLabel")}
              </FieldLabel>
              <Input
                id="create-api-key-rate-limit-max"
                type="number"
                min={1}
                max={1_000_000}
                value={field.value}
                onChange={(event) => field.onChange(Number(event.target.value))}
                onBlur={field.onBlur}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
              />
              <FieldMessage errors={[translatedFieldError(fieldState.error?.message, t)]} />
            </Field>
          )}
        />
        <Controller
          name="rateLimitWindow"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>{t("form.rateLimitWindowLabel")}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_RATE_LIMIT_WINDOW_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`rateLimitWindow.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldMessage errors={[translatedFieldError(fieldState.error?.message, t)]} />
            </Field>
          )}
        />
      </div>

      <Controller
        name="rateLimitEnabled"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
            <FieldContent>
              <FieldTitle>{t("form.rateLimitEnabledLabel")}</FieldTitle>
              <FieldMessage description={t("form.rateLimitHint")} />
            </FieldContent>
          </Field>
        )}
      />
    </>
  );
}

function PresetSelector({
  control,
  disabled,
  t,
}: {
  control: ReturnType<typeof useForm<ApiKeyCreateFormInput>>["control"];
  disabled: boolean;
  t: (key: string) => string;
}) {
  return (
    <Controller
      name="presetIds"
      control={control}
      render={({ field, fieldState }) => {
        const selected = field.value;
        const previewPermissions = expandApiKeyPresetIds(selected);

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>{t("form.scopesLabel")}</FieldLabel>
            <div className="grid gap-2">
              {apiKeyPermissionPresetOptions.map((option) => {
                const checked = selected.includes(option.value);

                return (
                  <Field key={option.value} orientation="horizontal">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(nextChecked) => {
                        field.onChange(
                          nextChecked
                            ? [...selected, option.value]
                            : selected.filter((value) => value !== option.value)
                        );
                      }}
                    />
                    <FieldContent>
                      <FieldTitle>{t(option.labelKey)}</FieldTitle>
                      <FieldMessage description={t(option.descriptionKey)} />
                    </FieldContent>
                  </Field>
                );
              })}
            </div>
            <FieldMessage errors={[translatedFieldError(fieldState.error?.message, t)]} />
            <div className="rounded-none border p-3">
              <p className="mb-2 text-xs font-medium">{t("form.permissionsPreviewTitle")}</p>
              <ApiKeyPermissionsPreview
                permissions={previewPermissions}
                emptyLabel={t("form.noPermissions")}
              />
            </div>
          </Field>
        );
      }}
    />
  );
}
