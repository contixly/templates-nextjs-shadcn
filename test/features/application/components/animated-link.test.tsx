import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import AnimatedLink from "@components/ui/custom/animated-link";

describe("AnimatedLink", () => {
  it("preserves caller-provided child structure", () => {
    render(
      <AnimatedLink href="/workspace">
        <span data-testid="icon">Icon</span>
        <span data-testid="label">Label</span>
      </AnimatedLink>
    );

    const link = screen.getByRole("link", { name: "Icon Label" });

    expect(link.children).toHaveLength(2);
    expect(link.children[0]).toBe(screen.getByTestId("icon"));
    expect(link.children[1]).toBe(screen.getByTestId("label"));
  });
});
