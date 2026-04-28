import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LoadingButton } from "src/components/ui/custom/button-loading";

describe("LoadingButton", () => {
  it("renders idle content without a leading spinner slot", () => {
    render(<LoadingButton loading={false}>Create</LoadingButton>);

    const button = screen.getByRole("button", { name: "Create" });

    expect(button).not.toHaveAttribute("aria-busy");
    expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
    expect(screen.getByText("Create")).not.toHaveClass("opacity-0");
  });

  it("overlays the loading spinner while preserving the content footprint", () => {
    render(<LoadingButton loading>Create</LoadingButton>);

    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Create")).toHaveClass("opacity-0");
    expect(screen.getByRole("status", { name: "Loading" })).toHaveClass("absolute");
  });
});
