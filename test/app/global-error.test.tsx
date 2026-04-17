import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import GlobalErrorPage from "../../src/app/global-error";

jest.mock("next-intl", () => ({
  useTranslations: () => {
    throw new Error("Missing NextIntlClientProvider context");
  },
}));

describe("GlobalErrorPage", () => {
  it("renders fallback UI without requiring next-intl hooks", () => {
    expect(() => render(<GlobalErrorPage error={new Error("boom")} />)).not.toThrow();

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
