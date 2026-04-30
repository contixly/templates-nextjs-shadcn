"use client";

import { startTransition, useState } from "react";
import { IconRobot } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@components/ui/alert";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { sanitizeRedirectPath } from "@lib/routes";

type LocalAutomationScenarioResult =
  | {
      success: true;
      data: unknown;
    }
  | {
      success: false;
      error?: {
        message?: string;
      };
    };

const LOCAL_AUTOMATION_SCENARIO_PATH = "/api/local-auth/scenario";
const DEFAULT_REDIRECT_PATH = "/dashboard";
const FALLBACK_ERROR_MESSAGE = "local_automation_sign_up_failed";

export const LocalAutomationLoginPanel = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const redirect = sanitizeRedirectPath(searchParams.get("redirect") ?? DEFAULT_REDIRECT_PATH);

  const createLocalAutomationUser = async () => {
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch(LOCAL_AUTOMATION_SCENARIO_PATH, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ redirect }),
      });
      const payload = (await response.json()) as LocalAutomationScenarioResult;

      if (!response.ok || !payload.success) {
        setError(
          payload.success
            ? FALLBACK_ERROR_MESSAGE
            : (payload.error?.message ?? FALLBACK_ERROR_MESSAGE)
        );
        return;
      }

      router.refresh();
      router.push(redirect);
    } catch {
      setError(FALLBACK_ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconRobot className="size-4" aria-hidden="true" />
          Local automation
        </CardTitle>
        <CardDescription>Create a local Better Auth user for browser testing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Local auth failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="button"
          className="w-full"
          disabled={isPending}
          onClick={() => {
            startTransition(() => {
              void createLocalAutomationUser();
            });
          }}
        >
          <IconRobot aria-hidden="true" />
          Create local automation user
        </Button>
      </CardContent>
    </Card>
  );
};
