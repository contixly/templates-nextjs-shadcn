import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import {
  SettingsPageSection,
  SettingsPageShell,
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
      "w-full",
      "max-w-6xl",
      "space-y-6"
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
});
