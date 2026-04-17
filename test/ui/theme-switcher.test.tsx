import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { renderToString } from "react-dom/server";
import { ThemeSwitcher } from "../../src/components/application/theme/theme-switcher";

const mockSetTheme = jest.fn();
let mockResolvedTheme: "dark" | "light" | undefined = "dark";

jest.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
    setTheme: mockSetTheme,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (key: "toggle" | "switchToLight" | "switchToDark") => {
    const messages = {
      toggle: "Toggle theme",
      switchToLight: "Switch to light theme",
      switchToDark: "Switch to dark theme",
    } as const;

    return messages[key];
  },
}));

describe("ThemeSwitcher", () => {
  beforeEach(() => {
    mockSetTheme.mockReset();
    mockResolvedTheme = "dark";
  });

  it("renders a stable fallback label before the theme is resolved", () => {
    mockResolvedTheme = undefined;

    render(<ThemeSwitcher />);

    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeDisabled();
  });

  it("renders stable server markup before hydration", () => {
    const html = renderToString(<ThemeSwitcher />);

    expect(html).toContain('aria-label="Toggle theme"');
    expect(html).toContain("disabled");
  });

  it("exposes an accessible label for the icon button and toggles the theme", () => {
    render(<ThemeSwitcher />);

    const button = screen.getByRole("button", { name: "Switch to light theme" });
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
