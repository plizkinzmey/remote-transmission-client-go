import React from "react";
import { IconButton } from "@radix-ui/themes";
import { useTheme } from "../contexts/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { AutoThemeIcon } from "./icons/AutoThemeIcon";
import { useLocalization } from "../contexts/LocalizationContext";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

  const handleThemeChange = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("auto");
    else setTheme("light");
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <SunIcon width={18} height={18} />;
      case "dark":
        return <MoonIcon width={18} height={18} />;
      default:
        return <AutoThemeIcon width={18} height={18} />;
    }
  };

  const getTitle = () => {
    switch (theme) {
      case "light":
        return t("settings.themeLight");
      case "dark":
        return t("settings.themeDark");
      default:
        return t("settings.themeAuto");
    }
  };

  return (
    <IconButton
      variant="ghost"
      onClick={handleThemeChange}
      aria-label={getTitle()}
    >
      {getIcon()}
    </IconButton>
  );
};
