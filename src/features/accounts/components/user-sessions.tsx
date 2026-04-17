"use client";

import React, { Suspense, use, useMemo, useTransition } from "react";
import { Session } from "better-auth";
import { ErrorBoundary } from "react-error-boundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { IconDeviceDesktop, IconDeviceMobile, IconX } from "@tabler/icons-react";
import { cn } from "@lib/utils";
import { Badge } from "@components/ui/badge";
import { timeTools } from "@lib/time";
import { toast } from "sonner";
import { revokeSession } from "@features/accounts/actions/revoke-session";
import { revokeAllSession } from "@features/accounts/actions/revoke-all-session";
import { useLocale, useTranslations } from "next-intl";

interface UserSessionsProps {
  loadCurrentUserSessionsPromise: Promise<Session[]>;
  loadCurrentSessionPromise: Promise<Session | undefined | null>;
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

  // Parse browser
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

  // Parse OS
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

export const UserSessionsComponent = ({
  loadCurrentUserSessionsPromise,
  loadCurrentSessionPromise,
}: UserSessionsProps) => {
  const t = useTranslations("accounts.ui.sessions");
  const locale = useLocale();
  const rawSessions = use(loadCurrentUserSessionsPromise);
  const currentSession = use(loadCurrentSessionPromise);
  const [isPending, startTransition] = useTransition();

  const handleRevokeSession = async (token: string) => {
    startTransition(async () => {
      const result = await revokeSession(token);
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

  const sessions = useMemo(
    () =>
      rawSessions
        .map((session) => ({
          ...session,
          isCurrent: session.token === currentSession?.token,
        }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
    [rawSessions, currentSession?.token]
  );

  if (!currentSession) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          {sessions?.filter((s) => s.id !== currentSession.id).length > 0 && (
            <Button variant="outline" size="sm" disabled={isPending} onClick={handleRevokeAll}>
              {t("revokeAll")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-80">
        {sessions.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
        {sessions.length > 0 && (
          <div className="space-y-4">
            {sessions.map((session) => {
              const parsed = parseUserAgent(session.userAgent, {
                unknownBrowser: t("unknownBrowser"),
                unknownOs: t("unknownOs"),
              });
              const DeviceIcon = parsed.isMobile ? IconDeviceMobile : IconDeviceDesktop;

              return (
                <div
                  key={session.id}
                  className={cn(
                    "relative flex items-center justify-between rounded-lg border p-4",
                    {
                      "border-primary bg-primary/5": session.isCurrent,
                    }
                  )}
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
                        onClick={() => handleRevokeSession(session.token)}
                      >
                        <IconX className="size-4" />
                        <span className="sr-only">{t("revokeSession")}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const UserSessions = (props: UserSessionsProps) => {
  const t = useTranslations("accounts.ui.sessions");

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">
              {t("loadError", {
                message: error instanceof Error ? error.message : t("unknownError"),
              })}
            </p>
          </CardContent>
        </Card>
      )}
    >
      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("title")}</CardTitle>
                  <CardDescription>{t("description")}</CardDescription>
                </div>
                <Button variant="outline" size="sm" disabled>
                  {t("revokeAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="min-h-80" />
          </Card>
        }
      >
        <UserSessionsComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};
