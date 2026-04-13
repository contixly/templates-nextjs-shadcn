"use client";

import { use, useMemo, useTransition } from "react";
import { UserProfileProps } from "@features/accounts/components/user-profile";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  createUpdateProfileFormSchema,
  UpdateProfileInput,
} from "@features/accounts/accounts-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Field, FieldDescription, FieldError } from "@components/ui/field";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import common from "@messages/common.json";
import { updateProfile } from "@features/accounts/actions/update-profile";

export const ProfileForm = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const profile = use(loadCurrentUserPromise);

  const formSchema = useMemo(
    () => createUpdateProfileFormSchema(profile?.name ?? ""),
    [profile?.name]
  );

  const [isPending, startTransition] = useTransition();
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
      const result = await updateProfile(data);

      if (result.success) {
        toast.success("Profile updated successfully");
        if (result.data) {
          reset({ name: result.data.name });
        }
      } else {
        toast.error("Update Profile", {
          description: result.error?.message ?? "Unknown error",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="flex gap-4">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="flex-1 space-y-2">
            <Input
              {...field}
              id="edit-profile-name"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your display name"
              maxLength={50}
              disabled={isPending}
              autoComplete="off"
            />
            <FieldDescription className="text-xs">Maximum 50 characters</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Button type="submit" disabled={isPending || !isDirty || !isValid} className="w-14">
        {common.words.verbs.save}
      </Button>
    </form>
  );
};
