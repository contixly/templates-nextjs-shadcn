import { z } from "zod";
import { id } from "@lib/z";

const WORKSPACE_NAME_MAX_LENGTH = 50;
const workspaceNamePattern = /^[\p{L}0-9\s\-_]+$/u;

const createWorkspaceNameSchema = (previousName?: string) =>
  z
    .string()
    .superRefine((value, ctx) => {
      const trimmedValue = value.trim().toLowerCase();

      if (trimmedValue.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Workspace name is required",
        });
      }

      if (trimmedValue.length > WORKSPACE_NAME_MAX_LENGTH) {
        ctx.addIssue({
          code: "custom",
          message: `Workspace name must be ${WORKSPACE_NAME_MAX_LENGTH} characters or less`,
        });
      }

      if (!workspaceNamePattern.test(trimmedValue)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Workspace name can only contain letters, numbers, spaces, hyphens, and underscores",
        });
      }

      if (
        previousName !== undefined &&
        value !== previousName &&
        trimmedValue === previousName.trim().toLowerCase()
      ) {
        ctx.addIssue({
          code: "custom",
          message: "New workspace name must be different from current name",
        });
      }
    })
    .transform((value) => value.trim());

const name = createWorkspaceNameSchema();

export const createWorkspaceSchema = z.object({
  name,
  isDefault: z.boolean().default(false),
});

export const updateWorkspaceSchema = z.object({
  id,
  name: name.optional(),
  isDefault: z.boolean().optional(),
});

export const createUpdateWorkspaceFormSchema = (previousName: string) =>
  z.object({
    id,
    name: createWorkspaceNameSchema(previousName).optional(),
    isDefault: z.boolean().optional(),
  });

export const deleteWorkspaceSchema = z
  .object({
    id,
    name: z.string(),
    confirmationText: z.string().trim().min(1, "Confirmation text is required"),
  })
  .refine((data) => data.confirmationText === data.name, {
    message: "Confirmation text does not match workspace name",
    path: ["confirmationText"],
  });

export type CreateWorkspaceInput = z.input<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.input<typeof updateWorkspaceSchema>;
export type DeleteWorkspaceInput = z.input<typeof deleteWorkspaceSchema>;
