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
import { updateApiKeyForCurrentUser } from "@features/api-keys/actions/update-api-key";
import {
  API_KEY_EXPIRATION_OPTIONS,
  API_KEY_RATE_LIMIT_WINDOW_OPTIONS,
  apiKeyUpdateFormSchema,
  type ApiKeyExpirationOption,
  type ApiKeyRateLimitWindowOption,
  type ApiKeyUpdateFormInput,
  type ApiKeyUpdateInput,
} from "@features/api-keys/api-keys-schemas";
import {
  apiKeyPermissionPresetOptions,
  expandApiKeyPresetIds,
} from "@features/api-keys/api-keys-permissions";
import {
  getPresetIdsForPermissions,
  translateApiKeyErrorMessage,
  translatedFieldError,
} from "@features/api-keys/components/api-key-component-utils";
import { ApiKeyPermissionsPreview } from "@features/api-keys/components/api-key-permissions-preview";
import type { ApiKeyListItemDto, ApiKeyOwnerType } from "@features/api-keys/api-keys-types";

interface ApiKeyEditDialogProps {
  ownerType: ApiKeyOwnerType;
  organizationId?: string;
  organizationKey?: string;
  apiKey: ApiKeyListItemDto;
  trigger: ReactElement;
}

const getExpirationOptionForDate = (expiresAt: Date | null): ApiKeyExpirationOption => {
  if (!expiresAt) {
    return "never";
  }

  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 7) {
    return "7d";
  }
  if (days <= 30) {
    return "30d";
  }
  if (days <= 90) {
    return "90d";
  }

  return "365d";
};

const getRateLimitWindowOption = (windowMs: number | null): ApiKeyRateLimitWindowOption => {
  switch (windowMs) {
    case 60 * 1000:
      return "1m";
    case 24 * 60 * 60 * 1000:
      return "1d";
    default:
      return "1h";
  }
};

export function ApiKeyEditDialog({
  ownerType,
  organizationId,
  organizationKey,
  apiKey,
  trigger,
}: ApiKeyEditDialogProps) {
  const t = useTranslations("apiKeys.ui");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const defaultValues = useMemo<ApiKeyUpdateFormInput>(
    () => ({
      type: ownerType,
      organizationId,
      organizationKey,
      keyId: apiKey.id,
      name: apiKey.name ?? "",
      presetIds: getPresetIdsForPermissions(apiKey.permissions),
      expiresIn: getExpirationOptionForDate(apiKey.expiresAt),
      rateLimitEnabled: apiKey.rateLimitEnabled,
      rateLimitMax: apiKey.rateLimitMax ?? 1000,
      rateLimitWindow: getRateLimitWindowOption(apiKey.rateLimitTimeWindow),
      enabled: apiKey.enabled,
    }),
    [apiKey, organizationId, organizationKey, ownerType]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { dirtyFields, isDirty, isValid },
  } = useForm<ApiKeyUpdateFormInput>({
    resolver: zodResolver(apiKeyUpdateFormSchema),
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
    }

    setOpen(nextOpen);
  };

  const submit: SubmitHandler<ApiKeyUpdateFormInput> = (data) => {
    const input: ApiKeyUpdateInput = {
      type: ownerType,
      organizationId,
      organizationKey,
      keyId: apiKey.id,
    };

    if (dirtyFields.name) input.name = data.name;
    if (dirtyFields.presetIds) input.presetIds = data.presetIds;
    if (dirtyFields.expiresIn) input.expiresIn = data.expiresIn;
    if (dirtyFields.rateLimitEnabled) input.rateLimitEnabled = data.rateLimitEnabled;
    if (dirtyFields.rateLimitMax) input.rateLimitMax = data.rateLimitMax;
    if (dirtyFields.rateLimitWindow) input.rateLimitWindow = data.rateLimitWindow;
    if (dirtyFields.enabled) input.enabled = data.enabled;

    startTransition(async () => {
      setFormError(null);
      const result = await updateApiKeyForCurrentUser(input);

      if (result.success) {
        toast.success(t("form.updateSuccess"));
        setOpen(false);
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
      title={t("form.editTitle")}
      description={t("form.editDescription")}
      trigger={trigger}
      className="sm:min-w-xl"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <FieldGroup>
          <ApiKeyEditFields control={control} disabled={isPending} t={t} apiKeyId={apiKey.id} />

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
              {tCommon("words.verbs.save")}
            </LoadingButton>
          </Field>
        </FieldGroup>
      </form>
    </Modal>
  );
}

function ApiKeyEditFields({
  control,
  disabled,
  t,
  apiKeyId,
}: {
  control: ReturnType<typeof useForm<ApiKeyUpdateFormInput>>["control"];
  disabled: boolean;
  t: (key: string) => string;
  apiKeyId: string;
}) {
  return (
    <>
      <Controller
        name="enabled"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
            <FieldContent>
              <FieldTitle>{t("form.enabledLabel")}</FieldTitle>
              <FieldMessage description={t("form.enabledHint")} />
            </FieldContent>
          </Field>
        )}
      />

      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`edit-api-key-name-${apiKeyId}`}>{t("form.nameLabel")}</FieldLabel>
            <Input
              {...field}
              id={`edit-api-key-name-${apiKeyId}`}
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
              <FieldLabel htmlFor={`edit-api-key-rate-limit-max-${apiKeyId}`}>
                {t("form.rateLimitMaxLabel")}
              </FieldLabel>
              <Input
                id={`edit-api-key-rate-limit-max-${apiKeyId}`}
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
  control: ReturnType<typeof useForm<ApiKeyUpdateFormInput>>["control"];
  disabled: boolean;
  t: (key: string) => string;
}) {
  return (
    <Controller
      name="presetIds"
      control={control}
      render={({ field, fieldState }) => {
        const selected = field.value ?? [];
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
