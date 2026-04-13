"use client";

import Script from "next/script";
import React, { FC } from "react";
import { YandexMetrikaInitParameters } from "@components/application/metrics/yandex-metrica-types";

interface AppYandexMetrikaProps {
  id: number;
  initParameters: YandexMetrikaInitParameters;
}

export const YandexMetrika: FC<AppYandexMetrikaProps> = ({ id, initParameters }) => {
  return (
    <>
      <Script type="text/javascript" id={`ym_${id}`}>
        {`(function (m, e, t, r, i, k, a) {
          m[i] =
            m[i] ||
            function () {
              (m[i].a = m[i].a || []).push(arguments);
            };
          m[i].l = 1 * new Date();
          for (var j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) {
              return;
            }
          }
          (k = e.createElement(t)),
            (a = e.getElementsByTagName(t)[0]),
            (k.async = 1),
            (k.src = r),
            a.parentNode.insertBefore(k, a);
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${id}", "ym");
        
        ym(${id}, "init", ${JSON.stringify(initParameters)});`}
      </Script>
    </>
  );
};
