import React from "react";
import { IconButton, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useTheme } from "../contexts/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { AutoThemeIcon } from "./icons/AutoThemeIcon";
import { useLocalization } from "../contexts/LocalizationContext";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          size="2"
          variant="soft"
          color="gray"
          aria-label={getTitle()}
        >
          {getIcon()}
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        <DropdownMenu.Item onClick={() => setTheme("light")}>
          <Flex gap="2" align="center">
            <SunIcon width={18} height={18} />
            <Text size="2">{t("settings.themeLight")}</Text>
          </Flex>
        </DropdownMenu.Item>

        <DropdownMenu.Item onClick={() => setTheme("dark")}>
          <Flex gap="2" align="center">
            <MoonIcon width={18} height={18} />
            <Text size="2">{t("settings.themeDark")}</Text>
          </Flex>
        </DropdownMenu.Item>

        <DropdownMenu.Item onClick={() => setTheme("auto")}>
          <Flex gap="2" align="center">
            <AutoThemeIcon width={18} height={18} />
            <Text size="2">{t("settings.themeAuto")}</Text>
          </Flex>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
