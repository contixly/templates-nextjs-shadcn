"use client";

import { IconCheck, IconLink } from "@tabler/icons-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ButtonWithTooltip } from "@components/ui/custom/button-with-tooltip";
import { DOCUMENTS_SYSTEM_LOG_SCOPE } from "@features/documents-system/documents-system-consts";

const COPIED_STATE_DELAY_MS = 1600;

const getHeadingUrl = (headingId: string) => {
  const url = new URL(window.location.href);
  url.hash = headingId;
  return url.toString();
};

const getCurrentHeadingId = (trigger: HTMLElement, fallbackId: string) =>
  trigger.closest("h2, h3")?.id.trim() || fallbackId;

export const DocumentsHeadingShareButton = ({
  headingId,
  label,
}: {
  headingId: string;
  label: string;
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (copiedTimerRef.current !== undefined) {
        window.clearTimeout(copiedTimerRef.current);
      }
    },
    []
  );

  const copyHeadingUrl = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const currentHeadingId = getCurrentHeadingId(event.currentTarget, headingId);

      navigator.clipboard
        .writeText(getHeadingUrl(currentHeadingId))
        .then(() => {
          setIsCopied(true);
          if (copiedTimerRef.current !== undefined) {
            window.clearTimeout(copiedTimerRef.current);
          }
          copiedTimerRef.current = window.setTimeout(() => {
            copiedTimerRef.current = undefined;
            setIsCopied(false);
          }, COPIED_STATE_DELAY_MS);
        })
        .catch((error) => {
          console.error(`[${DOCUMENTS_SYSTEM_LOG_SCOPE}] ${error}`);
        });
    },
    [headingId]
  );

  const Icon = isCopied ? IconCheck : IconLink;

  return (
    <ButtonWithTooltip
      aria-label={`Скопировать ссылку на раздел ${label}`}
      className="text-muted-foreground hover:text-foreground mt-0.5 opacity-70 hover:opacity-100 focus-visible:opacity-100"
      size="icon"
      tooltipContent={isCopied ? "Ссылка скопирована" : "Скопировать ссылку"}
      type="button"
      variant="ghost"
      onClick={copyHeadingUrl}
    >
      <Icon aria-hidden="true" size={16} />
    </ButtonWithTooltip>
  );
};
