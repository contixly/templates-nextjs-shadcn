import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { YandexMetrika } from "@components/application/metrics/yandex-metrika";
import { YandexMetrikaNoscript } from "@components/application/metrics/yandex-metrika-noscript";

jest.mock("next/script", () => ({
  __esModule: true,
  default: ({ children, id }: { children: React.ReactNode; id?: string }) => (
    <script data-testid="next-script" id={id}>
      {children}
    </script>
  ),
}));

describe("YandexMetrika", () => {
  it("does not render noscript markup in the client component tree", () => {
    const { container } = render(
      <YandexMetrika
        id={123}
        initParameters={{
          ssr: true,
          webvisor: true,
          clickmap: true,
          accurateTrackBounce: true,
        }}
      />
    );

    expect(screen.getByTestId("next-script")).toBeInTheDocument();
    expect(container.querySelector("noscript")).toBeNull();
  });

  it("renders the tracking pixel in a server-rendered noscript block", () => {
    const markup = renderToStaticMarkup(<YandexMetrikaNoscript id={123} />);

    expect(markup).toContain("<noscript>");
    expect(markup).toContain('src="https://mc.yandex.ru/watch/123"');
  });
});
