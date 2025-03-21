import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "../contexts/ThemeContext";
import { useLocalization } from "../contexts/LocalizationContext";
import { IconButton } from "@radix-ui/themes";

const ToggleContainer = styled.div`
  position: relative;
  width: 72px;
  height: 28px; // Уменьшаем высоту с 36px до 28px, соответствуя размеру иконок
  background: var(--toggle-background);
  border-radius: 14px; // Соответственно уменьшаем радиус с 18px до 14px
  cursor: pointer;
  padding: 3px; // Уменьшаем внутренние отступы для лучшей пропорции
  border: 1px solid var(--border-color);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;

  .rt-ThemeLight & {
    --toggle-background: rgba(0, 0, 0, 0.05);
    --text-secondary: rgba(0, 0, 0, 0.6);
    --border-color: rgba(0, 0, 0, 0.1);
  }

  .rt-ThemeDark & {
    --toggle-background: rgba(255, 255, 255, 0.1);
    --text-secondary: rgba(255, 255, 255, 0.6);
    --border-color: rgba(255, 255, 255, 0.1);
  }
`;

// Иконки теперь встроены в контейнер и не движутся вместе с кнопкой
const IconContainer = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  color: var(--text-secondary);
  opacity: 0.7;
  margin: 0 2px;
`;

const Slider = styled.div<{ position: "light" | "auto" | "dark" }>`
  position: absolute;
  left: ${(props) => {
    switch (props.position) {
      case "light":
        return "3px";
      case "auto":
        return "calc(50% - 10px)";
      case "dark":
        return "calc(100% - 23px)";
      default:
        return "3px";
    }
  }};
  width: 20px; // Уменьшаем с 28px до 20px для соответствия иконкам
  height: 20px; // Уменьшаем с 28px до 20px для соответствия иконкам
  background: var(--accent-color, #3498db);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
`;

const SunIcon = () => (
  <svg
    width="14" // Немного уменьшаем иконки для лучшей пропорции
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const SystemIcon = () => (
  <svg
    width="14" // Немного уменьшаем иконки для лучшей пропорции
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18" />
    <path d="M12 14a2 2 0 100-4 2 2 0 000 4z" fill="currentColor" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14" // Немного уменьшаем иконки для лучшей пропорции
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

  const nextTheme = () => {
    if (theme === "light") setTheme("auto");
    else if (theme === "auto") setTheme("dark");
    else setTheme("light");
  };

  const getActiveIcon = () => {
    switch (theme) {
      case "light":
        return <SunIcon />;
      case "auto":
        return <SystemIcon />;
      case "dark":
        return <MoonIcon />;
    }
  };

  const getTitle = () => {
    switch (theme) {
      case "light":
        return t("settings.themeLight");
      case "auto":
        return t("settings.themeAuto");
      case "dark":
        return t("settings.themeDark");
    }
  };

  return (
    <IconButton variant="ghost" className="icon-button">
      <ToggleContainer onClick={nextTheme} title={getTitle()}>
        <IconContainer>
          <SunIcon />
        </IconContainer>
        <IconContainer>
          <SystemIcon />
        </IconContainer>
        <IconContainer>
          <MoonIcon />
        </IconContainer>
        <Slider position={theme}>{getActiveIcon()}</Slider>
      </ToggleContainer>
    </IconButton>
  );
};
