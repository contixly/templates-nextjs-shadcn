"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  IconCheck,
  IconTrash,
  IconUserMinus,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { LoadingButton } from "@components/ui/custom/button-loading";
import { FieldMessage } from "@components/ui/custom/field-message";
import { FormErrorNotice } from "@components/ui/custom/form-error-notice";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@components/ui/field";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Separator } from "@components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { accountsTools } from "@features/accounts/accounts-tools";
import { addWorkspaceTeamMember } from "@features/workspaces/actions/add-workspace-team-member";
import { createWorkspaceTeam } from "@features/workspaces/actions/create-workspace-team";
import { deleteWorkspaceTeam } from "@features/workspaces/actions/delete-workspace-team";
import { removeWorkspaceTeamMember } from "@features/workspaces/actions/remove-workspace-team-member";
import { setActiveWorkspaceTeam } from "@features/workspaces/actions/set-active-workspace-team";
import { updateWorkspaceTeam } from "@features/workspaces/actions/update-workspace-team";
import { translateWorkspaceErrorMessage } from "@features/workspaces/workspaces-errors";
import {
  addWorkspaceTeamMemberSchema,
  createUpdateWorkspaceTeamFormSchema,
  createWorkspaceTeamFormSchema,
  type AddWorkspaceTeamMemberInput,
  type CreateWorkspaceTeamInput,
  type UpdateWorkspaceTeamInput,
} from "@features/workspaces/workspaces-teams-schemas";
import type {
  WorkspaceTeamAssignableMemberDto,
  WorkspaceTeamListItemDto,
  WorkspaceTeamMemberDto,
} from "@features/workspaces/workspaces-teams-types";
import { useAnyTranslations } from "@/src/i18n/use-any-translations";

interface WorkspaceSettingsTeamsPageProps {
  organizationId: string;
  teams: WorkspaceTeamListItemDto[];
  teamMembersByTeamId: Record<string, WorkspaceTeamMemberDto[]>;
  assignableMembers: WorkspaceTeamAssignableMemberDto[];
  currentUserId: string;
  activeTeamId: string | null;
  canCreateTeams: boolean;
  canUpdateTeams: boolean;
  canDeleteTeams: boolean;
  canAddTeamMembers: boolean;
  canRemoveTeamMembers: boolean;
}

const getDisplayName = (member: Pick<WorkspaceTeamMemberDto, "name" | "email">) =>
  member.name.trim() || member.email;

const getAvailableMembers = (
  assignableMembers: WorkspaceTeamAssignableMemberDto[],
  teamMembers: WorkspaceTeamMemberDto[]
) => {
  const teamMemberUserIds = new Set(teamMembers.map((member) => member.userId));

  return assignableMembers.filter((member) => !teamMemberUserIds.has(member.userId));
};

interface TeamCreateFormProps {
  organizationId: string;
}

const TeamCreateForm = ({ organizationId }: TeamCreateFormProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const formSchema = useMemo(() => createWorkspaceTeamFormSchema(tAny), [tAny]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<CreateWorkspaceTeamInput>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues: {
      organizationId,
      name: "",
    },
  });

  const submit: SubmitHandler<CreateWorkspaceTeamInput> = (data) => {
    startTransition(async () => {
      setFormError(null);
      const result = await createWorkspaceTeam(data);

      if (result.success) {
        toast.success(t("createSuccess"));
        reset({ organizationId, name: "" });
        router.refresh();
        return;
      }

      setFormError(
        translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError")
      );
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <FieldGroup>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="workspace-team-create-name">{t("createNameLabel")}</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  {...field}
                  id="workspace-team-create-name"
                  aria-invalid={fieldState.invalid}
                  placeholder={t("createNamePlaceholder")}
                  disabled={isPending}
                  autoComplete="off"
                  aria-describedby="workspace-team-create-name-message"
                />
                <LoadingButton
                  type="submit"
                  loading={isPending}
                  disabled={isPending || !isDirty || !isValid}
                >
                  {tCommon("words.verbs.create")}
                </LoadingButton>
              </div>
              <FieldMessage
                id="workspace-team-create-name-message"
                description={t("createNameHint")}
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        {formError ? (
          <FormErrorNotice title={t("createErrorTitle")}>{formError}</FormErrorNotice>
        ) : null}
      </FieldGroup>
    </form>
  );
};

interface TeamRenameFormProps {
  team: WorkspaceTeamListItemDto;
  canUpdateTeams: boolean;
}

const TeamRenameForm = ({ team, canUpdateTeams }: TeamRenameFormProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const formSchema = useMemo(
    () => createUpdateWorkspaceTeamFormSchema(team.name, tAny),
    [team.name, tAny]
  );
  const {
    control,
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<UpdateWorkspaceTeamInput>({
    resolver: zodResolver(formSchema),
    mode: "all",
    defaultValues: {
      organizationId: team.organizationId,
      teamId: team.id,
      name: team.name,
    },
  });

  const submit: SubmitHandler<UpdateWorkspaceTeamInput> = (data) => {
    startTransition(async () => {
      setFormError(null);
      const result = await updateWorkspaceTeam(data);

      if (result.success) {
        toast.success(t("renameSuccess"));
        router.refresh();
        return;
      }

      setFormError(
        translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError")
      );
    });
  };

  if (!canUpdateTeams) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(submit)}>
      <FieldGroup>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`workspace-team-${team.id}-name`}>
                {t("renameNameLabel")}
              </FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  {...field}
                  id={`workspace-team-${team.id}-name`}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={`workspace-team-${team.id}-name-message`}
                  disabled={isPending}
                  autoComplete="off"
                />
                <LoadingButton
                  type="submit"
                  variant="outline"
                  loading={isPending}
                  disabled={isPending || !isDirty || !isValid}
                >
                  {tCommon("words.verbs.save")}
                </LoadingButton>
              </div>
              <FieldMessage
                id={`workspace-team-${team.id}-name-message`}
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        {formError ? (
          <FormErrorNotice title={t("renameErrorTitle")}>{formError}</FormErrorNotice>
        ) : null}
      </FieldGroup>
    </form>
  );
};

interface TeamActiveControlProps {
  organizationId: string;
  teamId: string;
  isActive: boolean;
  canSetActive: boolean;
}

const TeamActiveControl = ({
  organizationId,
  teamId,
  isActive,
  canSetActive,
}: TeamActiveControlProps) => {
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const updateActiveTeam = () => {
    startTransition(async () => {
      const result = await setActiveWorkspaceTeam({
        organizationId,
        teamId: isActive ? null : teamId,
      });

      if (result.success) {
        toast.success(isActive ? t("clearActiveSuccess") : t("setActiveSuccess"));
        router.refresh();
        return;
      }

      toast.error(t("activeTeamErrorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError"),
      });
    });
  };

  if (isActive) {
    return (
      <LoadingButton
        type="button"
        size="sm"
        variant="secondary"
        loading={isPending}
        disabled={isPending}
        onClick={updateActiveTeam}
      >
        <IconCheck data-icon="inline-start" />
        {t("activeBadge")}
      </LoadingButton>
    );
  }

  if (!canSetActive) {
    return null;
  }

  return (
    <LoadingButton
      type="button"
      size="sm"
      variant="outline"
      loading={isPending}
      disabled={isPending}
      onClick={updateActiveTeam}
    >
      {t("setActiveAction")}
    </LoadingButton>
  );
};

interface TeamDeleteControlProps {
  team: WorkspaceTeamListItemDto;
}

const TeamDeleteControl = ({ team }: TeamDeleteControlProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteWorkspaceTeam({
        organizationId: team.organizationId,
        teamId: team.id,
      });

      if (result.success) {
        toast.success(t("deleteSuccess"));
        router.refresh();
        return;
      }

      toast.error(t("deleteErrorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError"),
      });
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="destructive" disabled={isPending}>
          <IconTrash data-icon="inline-start" />
          {tCommon("words.verbs.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteDialogTitle", { name: team.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDialogDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tCommon("words.verbs.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isPending} onClick={confirmDelete}>
            {tCommon("words.verbs.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface TeamMemberAddFormProps {
  organizationId: string;
  teamId: string;
  availableMembers: WorkspaceTeamAssignableMemberDto[];
  canAddTeamMembers: boolean;
}

const TeamMemberAddForm = ({
  organizationId,
  teamId,
  availableMembers,
  canAddTeamMembers,
}: TeamMemberAddFormProps) => {
  const tCommon = useTranslations("common");
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const hasAvailableMembers = availableMembers.length > 0;
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<AddWorkspaceTeamMemberInput>({
    resolver: zodResolver(addWorkspaceTeamMemberSchema),
    mode: "all",
    defaultValues: {
      organizationId,
      teamId,
      userId: "",
    },
  });

  const submit: SubmitHandler<AddWorkspaceTeamMemberInput> = (data) => {
    startTransition(async () => {
      setFormError(null);
      const result = await addWorkspaceTeamMember(data);

      if (result.success) {
        toast.success(t("addMemberSuccess"));
        reset({ organizationId, teamId, userId: "" });
        router.refresh();
        return;
      }

      setFormError(
        translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError")
      );
    });
  };

  if (!canAddTeamMembers) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(submit)}>
      <FieldGroup>
        <Controller
          name="userId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`workspace-team-${teamId}-member`}>
                {t("addMemberLabel")}
              </FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending || !hasAvailableMembers}
                >
                  <SelectTrigger
                    id={`workspace-team-${teamId}-member`}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={`workspace-team-${teamId}-member-message`}
                    className="w-full"
                  >
                    <SelectValue placeholder={t("addMemberPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableMembers.map((member) => (
                        <SelectItem key={member.userId} value={member.userId}>
                          {getDisplayName(member)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <LoadingButton
                  type="submit"
                  variant="outline"
                  loading={isPending}
                  disabled={isPending || !hasAvailableMembers || !isDirty || !isValid}
                >
                  <IconUserPlus data-icon="inline-start" />
                  {tCommon("words.verbs.add")}
                </LoadingButton>
              </div>
              <FieldMessage
                id={`workspace-team-${teamId}-member-message`}
                description={hasAvailableMembers ? t("addMemberHint") : t("addMemberEmptyHint")}
                errors={[fieldState.error]}
              />
            </Field>
          )}
        />
        {formError ? (
          <FormErrorNotice title={t("addMemberErrorTitle")}>{formError}</FormErrorNotice>
        ) : null}
      </FieldGroup>
    </form>
  );
};

interface TeamMemberRemoveControlProps {
  organizationId: string;
  teamId: string;
  member: WorkspaceTeamMemberDto;
}

const TeamMemberRemoveControl = ({
  organizationId,
  teamId,
  member,
}: TeamMemberRemoveControlProps) => {
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const tAny = useAnyTranslations("workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const removeMember = () => {
    startTransition(async () => {
      const result = await removeWorkspaceTeamMember({
        organizationId,
        teamId,
        userId: member.userId,
      });

      if (result.success) {
        toast.success(t("removeMemberSuccess"));
        router.refresh();
        return;
      }

      toast.error(t("removeMemberErrorTitle"), {
        description:
          translateWorkspaceErrorMessage(result.error?.message, tAny) ?? t("unknownError"),
      });
    });
  };

  return (
    <LoadingButton
      type="button"
      size="sm"
      variant="ghost"
      loading={isPending}
      disabled={isPending}
      onClick={removeMember}
      aria-label={t("removeMemberAriaLabel", { name: getDisplayName(member) })}
    >
      <IconUserMinus data-icon="inline-start" />
      {t("removeMemberAction")}
    </LoadingButton>
  );
};

export const WorkspaceSettingsTeamsPage = ({
  organizationId,
  teams,
  teamMembersByTeamId,
  assignableMembers,
  currentUserId,
  activeTeamId,
  canCreateTeams,
  canUpdateTeams,
  canDeleteTeams,
  canAddTeamMembers,
  canRemoveTeamMembers,
}: WorkspaceSettingsTeamsPageProps) => {
  const tPage = useTranslations("workspaces.pages.settings_teams");
  const t = useTranslations("workspaces.ui.settingsTeamsPage");
  const hasManagementControls =
    canCreateTeams || canUpdateTeams || canDeleteTeams || canAddTeamMembers || canRemoveTeamMembers;

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />

      <SettingsSection title={t("sectionTitle")} description={t("sectionDescription")}>
        <div className="flex flex-col gap-4">
          {!hasManagementControls ? (
            <Alert className="ring-foreground/10 border-0 ring-1">
              <IconUsersGroup aria-hidden="true" />
              <AlertTitle>{t("readOnlyTitle")}</AlertTitle>
              <AlertDescription>{t("readOnlyDescription")}</AlertDescription>
            </Alert>
          ) : null}

          {canCreateTeams ? <TeamCreateForm organizationId={organizationId} /> : null}

          {teams.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconUsersGroup />
                </EmptyMedia>
                <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {teams.map((team) => {
                const teamMembers = teamMembersByTeamId[team.id] ?? [];
                const availableMembers = getAvailableMembers(assignableMembers, teamMembers);
                const isActive = activeTeamId === team.id;
                const canSetActive = teamMembers.some((member) => member.userId === currentUserId);

                return (
                  <Card key={team.id}>
                    <CardHeader>
                      <CardTitle className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate">{team.name}</span>
                        <Badge variant="outline">
                          {t("memberCount", { count: String(team.memberCount) })}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{t("teamDescription")}</CardDescription>
                      <CardAction className="flex flex-wrap justify-end gap-2">
                        <TeamActiveControl
                          organizationId={organizationId}
                          teamId={team.id}
                          isActive={isActive}
                          canSetActive={canSetActive}
                        />
                        {canDeleteTeams ? <TeamDeleteControl team={team} /> : null}
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      <TeamRenameForm team={team} canUpdateTeams={canUpdateTeams} />

                      {(canUpdateTeams || canAddTeamMembers || canRemoveTeamMembers) &&
                      teamMembers.length > 0 ? (
                        <Separator />
                      ) : null}

                      <TeamMemberAddForm
                        organizationId={organizationId}
                        teamId={team.id}
                        availableMembers={availableMembers}
                        canAddTeamMembers={canAddTeamMembers}
                      />

                      {teamMembers.length === 0 ? (
                        <Empty className="border">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <IconUsersGroup />
                            </EmptyMedia>
                            <EmptyTitle>{t("membersEmptyTitle")}</EmptyTitle>
                            <EmptyDescription>{t("membersEmptyDescription")}</EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("membersTable.columns.user")}</TableHead>
                              <TableHead>{t("membersTable.columns.email")}</TableHead>
                              <TableHead>{t("membersTable.columns.role")}</TableHead>
                              {canRemoveTeamMembers ? (
                                <TableHead className="text-right">
                                  {t("membersTable.columns.actions")}
                                </TableHead>
                              ) : null}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {teamMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell className="min-w-48">
                                  <div className="flex items-center gap-3">
                                    <Avatar size="sm">
                                      {member.image ? (
                                        <AvatarImage
                                          src={member.image}
                                          alt={getDisplayName(member)}
                                        />
                                      ) : null}
                                      <AvatarFallback>
                                        {accountsTools.getInitials(getDisplayName(member))}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate font-medium">
                                      {getDisplayName(member)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {member.email}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
                                    {member.roleLabels.length > 0 ? (
                                      member.roleLabels.map((roleLabel) => (
                                        <Badge key={`${member.id}-${roleLabel}`} variant="outline">
                                          {roleLabel}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground">
                                        {t("membersTable.noRole")}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                {canRemoveTeamMembers ? (
                                  <TableCell className="text-right">
                                    <TeamMemberRemoveControl
                                      organizationId={organizationId}
                                      teamId={team.id}
                                      member={member}
                                    />
                                  </TableCell>
                                ) : null}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </SettingsSection>
    </>
  );
};
