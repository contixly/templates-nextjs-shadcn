import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Suspense, use } from "react";
import { AvatarImage } from "@components/ui/avatar";
import { Skeleton } from "@components/ui/skeleton";
import { User } from "better-auth";
import { accountsTools } from "@features/accounts/accounts-tools";
import { Input } from "@components/ui/input";
import { CopyButton } from "@components/ui/custom/copy-button";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { timeTools } from "@lib/time";
import { ProfileForm } from "@features/accounts/components/forms/profile-form";
import { useLocale, useTranslations } from "next-intl";

export interface UserProfileProps {
  loadCurrentUserPromise: Promise<User | undefined>;
}

export const UserProfile = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const tPage = useTranslations("accounts.pages.profile");
  const t = useTranslations("accounts.ui.profile");

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />

      <SettingsSection title={t("avatarTitle")} description={t("avatarDescription")}>
        <Suspense fallback={<AvatarCardSkeleton />}>
          <AvatarCardContent loadCurrentUserPromise={loadCurrentUserPromise} />
        </Suspense>
      </SettingsSection>

      <SettingsSection title={t("displayNameTitle")} description={t("displayNameDescription")}>
        <Suspense fallback={<ProfileFormSkeleton />}>
          <ProfileForm loadCurrentUserPromise={loadCurrentUserPromise} />
        </Suspense>
      </SettingsSection>

      <SettingsSection title={t("emailTitle")} description={t("emailDescription")}>
        <div className="flex flex-col gap-2">
          <Suspense fallback={<RowSkeleton />}>
            <EmailRow loadCurrentUserPromise={loadCurrentUserPromise} />
          </Suspense>
          <p className="text-muted-foreground text-sm">{t("emailHint")}</p>
        </div>
      </SettingsSection>

      <SettingsSection title={t("userIdTitle")} description={t("userIdDescription")}>
        <Suspense fallback={<RowSkeleton />}>
          <UserIdRow loadCurrentUserPromise={loadCurrentUserPromise} />
        </Suspense>
      </SettingsSection>

      <SettingsSection title={t("memberSinceTitle")} description={t("memberSinceDescription")}>
        <Suspense fallback={<LineSkeleton />}>
          <MemberSince loadCurrentUserPromise={loadCurrentUserPromise} />
        </Suspense>
      </SettingsSection>
    </>
  );
};

const AvatarCardContent = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const t = useTranslations("accounts.ui.profile");
  const profile = use(loadCurrentUserPromise);

  if (!profile) return null;

  return (
    <div className="flex items-center gap-6">
      <Avatar className="size-20">
        {profile.image && <AvatarImage src={profile.image} alt={profile.name} />}
        <AvatarFallback className="text-lg">
          {accountsTools.getInitials(profile.name)}
        </AvatarFallback>
      </Avatar>
      <div className="text-muted-foreground text-sm">
        <p>{t("avatarHintPrimary")}</p>
        <p>{t("avatarHintSecondary")}</p>
      </div>
    </div>
  );
};

const AvatarCardSkeleton = () => {
  const t = useTranslations("accounts.ui.profile");

  return (
    <div className="flex items-center gap-6">
      <Skeleton className="size-20 shrink-0 rounded-full" />
      <div className="text-muted-foreground text-sm">
        <p>{t("avatarHintPrimary")}</p>
        <p>{t("avatarHintSecondary")}</p>
      </div>
    </div>
  );
};

const EmailRow = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const profile = use(loadCurrentUserPromise);

  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <Input value={profile.email} disabled className="flex-1" />
      <CopyButton text={profile.email} variant="outline" size="icon" />
    </div>
  );
};

const UserIdRow = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const profile = use(loadCurrentUserPromise);

  if (!profile) return null;

  return (
    <div className="flex items-center gap-2">
      <Input value={profile.id} disabled className="flex-1 font-mono text-sm" />
      <CopyButton text={profile.id} variant="outline" size="icon" />
    </div>
  );
};

const RowSkeleton = () => (
  <div className="flex items-center gap-2">
    <Skeleton className="h-8 flex-1" />
    <Skeleton className="size-8" />
  </div>
);

const MemberSince = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const locale = useLocale();
  const profile = use(loadCurrentUserPromise);

  if (!profile) return null;

  return <p className="text-sm">{timeTools.formatDate(profile.createdAt, locale)}</p>;
};

const LineSkeleton = () => <Skeleton className="h-5 w-40" />;

const ProfileFormSkeleton = () => (
  <div className="flex gap-4">
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton className="h-8" />
      <Skeleton className="h-4 w-40" />
    </div>
    <Skeleton className="h-8 w-24" />
  </div>
);
