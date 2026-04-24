import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  SettingsPageIntro,
  SettingsPageSection,
  SettingsPageShell,
  SettingsSection,
} from "@components/application/settings/settings-shell";

describe("settings shell primitives", () => {
  it("renders the shared settings rail with the approved spacing and max width", () => {
    const { container, getByTestId } = render(
      <SettingsPageShell nav={<div data-testid="settings-nav">nav</div>}>
        <div data-testid="settings-child">content</div>
      </SettingsPageShell>
    );

    expect(getByTestId("settings-nav")).toBeInTheDocument();
    expect(container.querySelector('[data-slot="settings-content-rail"]')).toHaveClass(
      "min-w-0",
      "flex-1",
      "px-2",
      "md:mt-4",
      "md:px-4",
      "xl:px-6"
    );
    expect(container.querySelector('[data-slot="settings-page-rail"]')).toHaveClass(
      "mx-auto",
      "flex",
      "w-full",
      "max-w-6xl",
      "flex-col",
      "gap-6"
    );
  });

  it("applies the readable mode width cap only when requested", () => {
    const { container, rerender } = render(
      <SettingsPageSection mode="readable">
        <div>readable</div>
      </SettingsPageSection>
    );

    expect(container.querySelector('[data-slot="settings-page-section"]')).toHaveAttribute(
      "data-mode",
      "readable"
    );
    expect(container.querySelector('[data-slot="settings-page-section"]')).toHaveClass(
      "w-full",
      "max-w-3xl"
    );

    rerender(
      <SettingsPageSection mode="wide">
        <div>wide</div>
      </SettingsPageSection>
    );

    expect(container.querySelector('[data-slot="settings-page-section"]')).toHaveAttribute(
      "data-mode",
      "wide"
    );
    expect(container.querySelector('[data-slot="settings-page-section"]')).not.toHaveClass(
      "max-w-3xl"
    );
  });

  it("renders a contextual page intro before section islands", () => {
    const { container } = render(
      <SettingsPageSection mode="readable">
        <SettingsPageIntro title="Profile settings" description="Review your account details." />
        <SettingsSection title="Display name" description="Change the name shown in the app.">
          <div>Form fields</div>
        </SettingsSection>
      </SettingsPageSection>
    );

    const pageSection = container.querySelector('[data-slot="settings-page-section"]');
    const intro = container.querySelector('[data-slot="settings-page-intro"]');

    expect(pageSection?.firstElementChild).toBe(intro);
    expect(screen.getByRole("heading", { level: 1, name: "Profile settings" })).toBeInTheDocument();
    expect(screen.getByText("Review your account details.")).toBeInTheDocument();
  });

  it("renders section islands with semantic headings, actions, and destructive emphasis", () => {
    const { container } = render(
      <SettingsSection
        title="Delete account"
        description="Permanently remove the account."
        variant="destructive"
        action={<button type="button">Delete</button>}
      >
        <p>Deletion warning.</p>
      </SettingsSection>
    );

    const section = container.querySelector('[data-slot="settings-section"]');
    const heading = screen.getByRole("heading", { level: 2, name: "Delete account" });

    expect(section).toHaveAttribute("data-variant", "destructive");
    expect(section).toHaveAttribute("aria-labelledby", heading.id);
    expect(section).toHaveClass("ring-destructive/40");
    expect(container.querySelector('[data-slot="settings-section-action"]')).toHaveTextContent(
      "Delete"
    );
    expect(container.querySelector('[data-slot="settings-section-content"]')).toHaveTextContent(
      "Deletion warning."
    );
  });
});
