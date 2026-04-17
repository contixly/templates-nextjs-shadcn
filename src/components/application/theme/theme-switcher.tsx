"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@components/ui/button";
import { IconMoon, IconSun } from "@tabler/icons-react";

export const ThemeSwitcher = () => {
  const t = useTranslations("common.ui.themeSwitcher");
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted || !resolvedTheme) {
    return (
      <Button variant="outline" size="icon" aria-label={t("toggle")} title={t("toggle")} disabled>
        <IconSun
          aria-hidden="true"
          className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
        />
        <IconMoon
          aria-hidden="true"
          className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        />
      </Button>
    );
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const nextThemeLabel = nextTheme === "light" ? t("switchToLight") : t("switchToDark");

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
      onClick={() => setTheme(nextTheme)}
    >
      <IconSun
        aria-hidden="true"
        className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
      />
      <IconMoon
        aria-hidden="true"
        className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
      />
    </Button>
  );
};
