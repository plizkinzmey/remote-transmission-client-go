import React, { useCallback } from "react";
import { IconButton, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useTheme } from "../../contexts/ThemeContext";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { AutoThemeIcon } from "../icons/AutoThemeIcon";
import { useLocalization } from "../../contexts/LocalizationContext";
import styles from './ThemeToggle.module.css';

/**
 * Компонент для переключения темы приложения.
 * Позволяет выбрать светлую, темную или автоматическую тему.
 * Использует ThemeContext для управления темой и LocalizationContext для локализации.
 *
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

  /**
   * Возвращает иконку в зависимости от текущей темы
   */
  const getIcon = useCallback(() => {
    switch (theme) {
      case "light":
        return <SunIcon width={18} height={18} data-testid="theme-icon-light" />;
      case "dark":
        return <MoonIcon width={18} height={18} data-testid="theme-icon-dark" />;
      default:
        return <AutoThemeIcon width={18} height={18} data-testid="theme-icon-auto" />;
    }
  }, [theme]);

  /**
   * Возвращает локализованный заголовок в зависимости от текущей темы
   */
  const getTitle = useCallback(() => {
    switch (theme) {
      case "light":
        return t("settings.themeLight");
      case "dark":
        return t("settings.themeDark");
      default:
        return t("settings.themeAuto");
    }
  }, [theme, t]);

  return (
    <div className={styles.container} data-testid="theme-toggle">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton
            size="2"
            variant="soft"
            color="gray"
            aria-label={getTitle()}
            className={styles.toggleButton}
            data-testid="theme-toggle-button"
          >
            {getIcon()}
          </IconButton>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content data-testid="theme-toggle-menu">
          <DropdownMenu.Item
            onClick={() => setTheme("light")}
            data-testid="theme-toggle-light"
          >
            <Flex gap="2" align="center" className={styles.menuItem}>
              <SunIcon width={18} height={18} />
              <Text size="2">{t("settings.themeLight")}</Text>
            </Flex>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => setTheme("dark")}
            data-testid="theme-toggle-dark"
          >
            <Flex gap="2" align="center" className={styles.menuItem}>
              <MoonIcon width={18} height={18} />
              <Text size="2">{t("settings.themeDark")}</Text>
            </Flex>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onClick={() => setTheme("auto")}
            data-testid="theme-toggle-auto"
          >
            <Flex gap="2" align="center" className={styles.menuItem}>
              <AutoThemeIcon width={18} height={18} />
              <Text size="2">{t("settings.themeAuto")}</Text>
            </Flex>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};