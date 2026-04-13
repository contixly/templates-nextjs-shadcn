import React from "react";

interface YandexMetrikaNoscriptProps {
  id: number;
}

export const YandexMetrikaNoscript = ({ id }: YandexMetrikaNoscriptProps) => {
  return (
    <noscript>
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://mc.yandex.ru/watch/${id}`}
          style={{ position: "absolute", left: "-9999px" }}
          alt=""
        />
      </div>
    </noscript>
  );
};
