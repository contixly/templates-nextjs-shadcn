import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { WorkspaceAddMemberDialog } from "@features/workspaces/components/forms/workspace-add-member-dialog";
import { WorkspaceCreateInvitationDialog } from "@features/workspaces/components/forms/workspace-create-invitation-dialog";
import { addWorkspaceMember } from "@features/workspaces/actions/add-workspace-member";
import { createWorkspaceInvitation } from "@features/workspaces/actions/create-workspace-invitation";

const mockRefresh = jest.fn();
const ORGANIZATION_ID = "RkFBy8l5f36JR4Mwl1dExZxvzCjD8X7H";

jest.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages = {
      common: {
        words: {
          verbs: {
            add: "Add",
            cancel: "Cancel",
            close: "Close",
            copy: "Copy",
            create: "Create",
          },
        },
      },
      workspaces: {
        validation: {
          errors: {
            invitationEmailRequired: "Invitation email is required",
            invitationEmailInvalid: "Invitation email must be valid",
            memberIdRequired: "User ID is required",
            workspaceRoleInvalid: "Choose a supported workspace role",
          },
        },
        ui: {
          roles: {
            labels: {
              member: "Member",
              admin: "Admin",
              owner: "Owner",
            },
          },
          createInvitationDialog: {
            title: "Invite By Email",
            description: "Create a shareable invitation link.",
            trigger: "Invite By Email",
            emailLabel: "Email",
            emailPlaceholder: "person@example.com",
            emailHint: "Use a verified email.",
            roleLabel: "Role",
            roleHint: "Choose the role this invitation will grant.",
            createdTitle: "Invitation created",
            createdDescription: "Copy this link.",
            linkLabel: "Invitation link",
            createAnother: "Create another invitation",
            copied: "Copied",
            success: "Invitation created successfully",
            errorTitle: "Create Invitation",
            unknownError: "Unknown error",
          },
          addMemberDialog: {
            title: "Add Existing User",
            description: "Add an existing account.",
            trigger: "Add Member",
            userIdLabel: "User ID",
            userIdPlaceholder: "ck123example",
            userIdHint: "Use the exact internal user ID.",
            roleLabel: "Role",
            roleHint: "Choose the role this user will receive.",
            success: "Member added successfully",
            errorTitle: "Add Member",
            unknownError: "Unknown error",
          },
        },
      },
    };

    const path = [namespace, key].filter(Boolean).join(".");
    const value = path.split(".").reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === "object" && segment in acc) {
        return (acc as Record<string, unknown>)[segment];
      }

      return path;
    }, messages);

    return typeof value === "string" ? value : path;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

jest.mock("@/src/i18n/use-any-translations", () => ({
  useAnyTranslations: () => (key: string) => {
    const messages: Record<string, string> = {
      "validation.errors.invitationEmailRequired": "Invitation email is required",
      "validation.errors.invitationEmailInvalid": "Invitation email must be valid",
      "validation.errors.memberIdRequired": "User ID is required",
      "validation.errors.workspaceRoleInvalid": "Choose a supported workspace role",
    };

    return messages[key] ?? key;
  },
}));

jest.mock("@components/ui/custom/modal", () => ({
  Modal: ({ children, trigger }: { children?: React.ReactNode; trigger?: React.ReactNode }) => (
    <div>
      {trigger}
      {children}
    </div>
  ),
}));

jest.mock("@components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
    disabled,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children?: React.ReactNode;
    disabled?: boolean;
  }) => (
    <select
      aria-label="Role"
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children?: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

jest.mock("@features/workspaces/actions/add-workspace-member", () => ({
  addWorkspaceMember: jest.fn(),
}));

jest.mock("@features/workspaces/actions/create-workspace-invitation", () => ({
  createWorkspaceInvitation: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe("workspace role dialogs", () => {
  beforeEach(() => {
    (addWorkspaceMember as jest.Mock).mockReset();
    (createWorkspaceInvitation as jest.Mock).mockReset();
    mockRefresh.mockReset();
  });

  it("submits the selected role when adding an existing member", async () => {
    (addWorkspaceMember as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        organizationId: "org-1",
        userId: "d6qzollaqro6y66v7j52bhqo",
      },
    });

    render(
      <WorkspaceAddMemberDialog
        organizationId={ORGANIZATION_ID}
        assignableRoles={["member", "admin"]}
      />
    );

    fireEvent.change(screen.getByLabelText("User ID"), {
      target: { value: "d6qzollaqro6y66v7j52bhqo" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "admin" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByLabelText("User ID").closest("form")!);
    });

    await waitFor(() => {
      expect(addWorkspaceMember).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        userId: "d6qzollaqro6y66v7j52bhqo",
        role: "admin",
      });
    });
  });

  it("limits invitation role options to the roles the acting member can assign", async () => {
    (createWorkspaceInvitation as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        id: "invite-1",
        invitationUrl: "https://example.com/invite/invite-1",
      },
    });

    render(
      <WorkspaceCreateInvitationDialog
        organizationId={ORGANIZATION_ID}
        assignableRoles={["member", "admin"]}
      />
    );

    expect(screen.getByRole("option", { name: "Member" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Admin" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Owner" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "admin" },
    });

    await act(async () => {
      fireEvent.submit(screen.getByLabelText("Email").closest("form")!);
    });

    await waitFor(() => {
      expect(createWorkspaceInvitation).toHaveBeenCalledWith({
        organizationId: ORGANIZATION_ID,
        email: "admin@example.com",
        role: "admin",
      });
    });
  });
});
