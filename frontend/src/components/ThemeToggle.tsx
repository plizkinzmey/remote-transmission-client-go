import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "../contexts/ThemeContext";
import { useLocalization } from "../contexts/LocalizationContext";

const ToggleContainer = styled.div`
  position: relative;
  width: 72px;
  height: 36px;
  background: var(--toggle-background);
  border-radius: 18px;
  cursor: pointer;
  padding: 4px;
  border: 1px solid var(--border-color);
  box-sizing: border-box;
  display: flex;
  align-items: center;
`;

const getSliderPosition = (position: "light" | "auto" | "dark"): string => {
  switch (position) {
    case "light":
      return "0";
    case "auto":
      return "calc(50% - 14px)";
    case "dark":
      return "calc(100% - 28px)";
    default:
      return "0";
  }
};

const Slider = styled.div<{ position: "light" | "auto" | "dark" }>`
  position: absolute;
  width: 28px;
  height: 28px;
  background: var(--button-active-background);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--button-active-text);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(${(props) => getSliderPosition(props.position)});
`;

const SunIcon = () => (
  <svg
    width="16"
    height="16"
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
    width="16"
    height="16"
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
    width="16"
    height="16"
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

  const getCurrentIcon = () => {
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
    <ToggleContainer onClick={nextTheme} title={getTitle()}>
      <Slider position={theme}>{getCurrentIcon()}</Slider>
    </ToggleContainer>
  );
};
