import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Suspense, use } from "react";
import { AvatarImage } from "@components/ui/avatar";
import { Skeleton } from "@components/ui/skeleton";
import { User } from "better-auth";
import { accountsTools } from "@features/accounts/accounts-tools";
import { Input } from "@components/ui/input";
import { CopyButton } from "@components/ui/custom/copy-button";
import { timeTools } from "@lib/time";
import { ProfileForm } from "@features/accounts/components/forms/profile-form";

export interface UserProfileProps {
  loadCurrentUserPromise: Promise<User | undefined>;
}

export const UserProfile = ({ loadCurrentUserPromise }: UserProfileProps) => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Your avatar is synced from your connected social account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AvatarCardSkeleton />}>
            <AvatarCardContent loadCurrentUserPromise={loadCurrentUserPromise} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            This is the name that will be displayed across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ProfileFormSkeleton />}>
            <ProfileForm loadCurrentUserPromise={loadCurrentUserPromise} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Your email address is used for notifications and account recovery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RowSkeleton />}>
            <EmailRow loadCurrentUserPromise={loadCurrentUserPromise} />
          </Suspense>
          <p className="text-muted-foreground mt-2 text-sm">
            Email cannot be changed. It is linked to your social account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User ID</CardTitle>
          <CardDescription>Your unique identifier in our system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<RowSkeleton />}>
            <UserIdRow loadCurrentUserPromise={loadCurrentUserPromise} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Member Since</CardTitle>
          <CardDescription>The date you created your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LineSkeleton />}>
            <MemberSince loadCurrentUserPromise={loadCurrentUserPromise} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
};

const AvatarCardContent = ({ loadCurrentUserPromise }: UserProfileProps) => {
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
        <p>Avatar images are provided by your connected accounts.</p>
        <p>To change your avatar, update it on Google or GitHub.</p>
      </div>
    </div>
  );
};

const AvatarCardSkeleton = () => (
  <div className="flex items-center gap-6">
    <Skeleton className="size-20 shrink-0 rounded-full" />
    <div className="text-muted-foreground text-sm">
      <p>Avatar images are provided by your connected accounts.</p>
      <p>To change your avatar, update it on Google or GitHub.</p>
    </div>
  </div>
);

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
    <Skeleton className="h-8 w-8" />
  </div>
);

const MemberSince = ({ loadCurrentUserPromise }: UserProfileProps) => {
  const profile = use(loadCurrentUserPromise);

  if (!profile) return null;

  return <p className="text-sm">{timeTools.formatDate(profile.createdAt)}</p>;
};

const LineSkeleton = () => <Skeleton className="h-5 w-40" />;

const ProfileFormSkeleton = () => (
  <div className="flex gap-4">
    <div className="flex flex-1 flex-col gap-2 space-y-2">
      <Skeleton className="h-8" />
      <Skeleton className="h-4 w-40" />
    </div>
    <Skeleton className="h-8 w-14" />
  </div>
);
