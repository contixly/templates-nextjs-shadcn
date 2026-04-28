"use client";

import { use, useMemo, useState, useTransition } from "react";
import { UserProfileProps } from "@features/accounts/components/user-profile";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  createUpdateProfileFormSchema,
  UpdateProfileInput,
} from "@features/accounts/accounts-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Field } from "@components/ui/field";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { updateProfile } from "@features/accounts/actions/update-profile";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";
import { translateAccountErrorMessage } from "@features/accounts/accounts-errors";
import { FieldMessage } from "@components/ui/custom/field-message";
import { FormErrorNotice } from "@components/ui/custom/form-error-notice";

export const ProfileForm = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const profile = use(loadCurrentUserPromise);
  const tCommon = useTranslations("common");
  const tAccounts = useTranslations("accounts.ui.profileForm");
  const tAny = useAnyTranslations("accounts");

  const formSchema = useMemo(
    () => createUpdateProfileFormSchema(profile?.name ?? "", tAny),
    [profile?.name, tAny]
  );

  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues: { name: profile?.name ?? "" },
  });

  const submit: SubmitHandler<UpdateProfileInput> = (data) => {
    if (!profile) return;

    startTransition(async () => {
      setFormError(null);
      const result = await updateProfile(data);

      if (result.success) {
        toast.success(tAccounts("success"));
        if (result.data) {
          reset({ name: result.data.name });
        }
      } else {
        setFormError(
          translateAccountErrorMessage(result.error?.message, tAny) ?? tAccounts("unknownError")
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-3">
      <div className="flex gap-4">
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="flex-1 gap-2">
              <Input
                {...field}
                id="edit-profile-name"
                aria-invalid={fieldState.invalid}
                aria-describedby="edit-profile-name-message"
                placeholder={tAccounts("namePlaceholder")}
                maxLength={50}
                disabled={isPending}
                autoComplete="off"
              />
              <FieldMessage
                id="edit-profile-name-message"
                description={tAccounts("nameHint")}
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={isPending || !isDirty || !isValid}
          className="min-w-fit px-4"
        >
          {tCommon("words.verbs.save")}
        </Button>
      </div>
      {formError ? (
        <FormErrorNotice title={tAccounts("errorTitle")}>{formError}</FormErrorNotice>
      ) : null}
    </form>
  );
};
