import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "src/components/ui/button";
import { ButtonLoading } from "src/components/ui/custom/button-loading";

describe("ButtonLoading", () => {
  it("keeps the loading spinner mounted while idle to preserve button width", () => {
    const { container } = render(
      <Button>
        <ButtonLoading loading={false} />
        Create
      </Button>
    );

    const spinner = container.querySelector('[data-icon="inline-start"]');

    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("invisible");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
  });

  it("exposes the loading spinner when the button is loading", () => {
    render(
      <Button>
        <ButtonLoading loading />
        Create
      </Button>
    );

    expect(screen.getByRole("status", { name: "Loading" })).not.toHaveClass("invisible");
  });
});
