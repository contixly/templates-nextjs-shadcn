"use client";

import { IconSettings } from "@tabler/icons-react";
import React, { useState } from "react";
import { Button } from "@components/ui/button";
import type { WorkspaceWithCounts } from "@features/workspaces/workspaces-types";
import { Modal, ModalProps } from "@components/ui/custom/modal";
import { useTranslations } from "next-intl";
import { WorkspaceSettingsForm } from "@features/workspaces/components/forms/workspace-settings-form";

interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithCounts | null;
  onSuccess?: () => void;
  canUpdateWorkspace?: boolean;
}

export function WorkspaceSettingsDialog({
  workspace,
  onSuccess,
  canUpdateWorkspace,
  ...props
}: WorkspaceSettingsDialogProps & Partial<ModalProps>) {
  const tWorkspaces = useTranslations("workspaces.ui.settingsDialog");
  const [open, onOpenChange] = useState(false);

  if (!workspace) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={tWorkspaces("title")}
      description={tWorkspaces("description")}
      trigger={
        <Button variant="ghost" size="icon">
          <IconSettings className="size-4" />
          <span className="sr-only">{tWorkspaces("trigger")}</span>
        </Button>
      }
      {...props}
    >
      <WorkspaceSettingsForm
        workspace={workspace}
        canUpdateWorkspace={canUpdateWorkspace}
        autoFocusNameField
        showCancelButton
        onCancel={() => onOpenChange(false)}
        onSuccess={() => {
          onOpenChange(false);
          onSuccess?.();
        }}
      />
    </Modal>
  );
}
