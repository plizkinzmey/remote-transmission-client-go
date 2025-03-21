import React from "react";
import { IconButton } from "@radix-ui/themes";
import { useTheme } from "../contexts/ThemeContext";
import {
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { useLocalization } from "../contexts/LocalizationContext";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

  const handleThemeChange = () => {
    // Циклическое переключение темы: light -> dark -> auto -> light
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("auto");
    else setTheme("light");
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <SunIcon width={20} height={20} />;
      case "dark":
        return <MoonIcon width={20} height={20} />;
      default:
        return <ComputerDesktopIcon width={20} height={20} />;
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
