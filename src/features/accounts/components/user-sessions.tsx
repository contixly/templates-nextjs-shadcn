"use client";

import React, { Suspense, use, useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@components/ui/button";
import { IconDeviceDesktop, IconDeviceMobile, IconX } from "@tabler/icons-react";
import { cn } from "@lib/utils";
import { Badge } from "@components/ui/badge";
import {
  SettingsPageIntro,
  SettingsSection,
} from "@components/application/settings/settings-shell";
import { timeTools } from "@lib/time";
import { toast } from "sonner";
import { revokeSession } from "@features/accounts/actions/revoke-session";
import { revokeAllSession } from "@features/accounts/actions/revoke-all-session";
import { useLocale, useTranslations } from "next-intl";
import type { UserSessionListItem } from "@features/accounts/accounts-types";

interface UserSessionsProps {
  loadCurrentUserSessionsPromise: Promise<UserSessionListItem[]>;
}

const parseUserAgent = (
  userAgent?: string | null,
  labels?: {
    unknownBrowser: string;
    unknownOs: string;
  }
): {
  browser: string;
  os: string;
  isMobile: boolean;
} => {
  if (!userAgent) {
    return {
      browser: labels?.unknownBrowser ?? "Unknown Browser",
      os: labels?.unknownOs ?? "Unknown OS",
      isMobile: false,
    };
  }

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

  let browser = labels?.unknownBrowser ?? "Unknown Browser";
  if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg/")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Opera") || userAgent.includes("OPR")) {
    browser = "Opera";
  }

  let os = labels?.unknownOs ?? "Unknown OS";
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac OS")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  }

  return { browser, os, isMobile };
};

export const UserSessionsComponent = ({ loadCurrentUserSessionsPromise }: UserSessionsProps) => {
  const t = useTranslations("accounts.ui.sessions");
  const locale = useLocale();
  const sessions = use(loadCurrentUserSessionsPromise);
  const [isPending, startTransition] = useTransition();
  const currentSession = sessions.find((session) => session.isCurrent);

  const handleRevokeSession = async (sessionId: string) => {
    startTransition(async () => {
      const result = await revokeSession(sessionId);
      if (result.success) {
        toast.success(t("revokeSuccess"));
      } else {
        toast.error(t("revokeErrorTitle"), {
          description: result.error?.message ?? t("unknownError"),
        });
      }
    });
  };

  const handleRevokeAll = async () => {
    startTransition(async () => {
      const result = await revokeAllSession();
      if (result.success) {
        toast.success(t("revokeSuccess"));
      } else {
        toast.error(t("revokeErrorTitle"), {
          description: result.error?.message ?? t("unknownError"),
        });
      }
    });
  };

  if (!currentSession) return null;

  return (
    <SettingsSection
      title={t("title")}
      description={t("description")}
      action={
        sessions.some((session) => !session.isCurrent) ? (
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleRevokeAll}>
            {t("revokeAll")}
          </Button>
        ) : null
      }
      contentClassName="min-h-80"
    >
      {sessions.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
      {sessions.length > 0 && (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => {
            const parsed = parseUserAgent(session.userAgent, {
              unknownBrowser: t("unknownBrowser"),
              unknownOs: t("unknownOs"),
            });
            const DeviceIcon = parsed.isMobile ? IconDeviceMobile : IconDeviceDesktop;

            return (
              <div
                key={session.id}
                className={cn("relative flex items-center justify-between rounded-lg border p-4", {
                  "border-primary bg-primary/5": session.isCurrent,
                })}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                    <DeviceIcon className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {t("browserOnOs", { browser: parsed.browser, os: parsed.os })}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 truncate text-xs text-wrap md:text-sm">
                      {session.ipAddress && <span>{session.ipAddress}</span>}
                    </div>
                    <span>
                      {t("lastActive", {
                        time: timeTools.formatRelativeTime(session.updatedAt, locale),
                      })}
                    </span>
                  </div>
                </div>
                {session.isCurrent && (
                  <Badge className="absolute top-2 right-2">{t("currentSession")}</Badge>
                )}

                <div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      <IconX />
                      <span className="sr-only">{t("revokeSession")}</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SettingsSection>
  );
};

export const UserSessions = (props: UserSessionsProps) => {
  const tPage = useTranslations("accounts.pages.security");
  const t = useTranslations("accounts.ui.sessions");

  return (
    <>
      <SettingsPageIntro title={tPage("title")} description={tPage("description")} />
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <SettingsSection title={t("title")} description={t("description")}>
            <p className="text-destructive">
              {t("loadError", {
                message: error instanceof Error ? error.message : t("unknownError"),
              })}
            </p>
          </SettingsSection>
        )}
      >
        <Suspense
          fallback={
            <SettingsSection
              title={t("title")}
              description={t("description")}
              action={
                <Button variant="outline" size="sm" disabled>
                  {t("revokeAll")}
                </Button>
              }
              contentClassName="min-h-80"
            >
              <div />
            </SettingsSection>
          }
        >
          <UserSessionsComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
