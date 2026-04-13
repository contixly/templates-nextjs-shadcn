"use client";

import { PropsWithClassName } from "@typings/ui";
import { useIsMobile } from "@hooks/use-mobile";
import React, { PropsWithChildren } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@components/ui/drawer";
import { cn } from "@lib/utils";

export interface ModalProps extends PropsWithClassName {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  trigger?: React.JSX.Element;
  triggerClassName?: string;
}

/**
 * Modal - Shared component that renders Dialog on desktop and Drawer on mobile.
 *
 * This wrapper abstracts the desktop/mobile dialog pattern to avoid code duplication.
 *
 * Implementation:
 * - Uses useIsMobile hook to detect screen width
 * - Conditionally renders Dialog (desktop >= 768px) or Drawer (mobile < 768px)
 * - Shares same content children between both dialog types
 * - Handles focus management and escape key consistently
 *
 * Usage:
 * <Modal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Create New Workspace"
 *   description="Workspaces help you organize..."
 *   trigger={<Button>Create Workspace</Button>}
 * >
 *   <CreateWorkspaceForm onSuccess={handleSuccess} />
 * </Modal>
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  trigger,
  className,
  triggerClassName,
}: ModalProps & PropsWithChildren) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && (
          <DrawerTrigger className={triggerClassName} asChild>
            {trigger}
          </DrawerTrigger>
        )}
        {open && (
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
            <div className="px-4 pb-4">{children}</div>
          </DrawerContent>
        )}
      </Drawer>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && (
        <AlertDialogTrigger className={triggerClassName} asChild>
          {trigger}
        </AlertDialogTrigger>
      )}
      {open && (
        <AlertDialogContent className={cn("gap-6 min-w-md", className)}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
          {children}
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
