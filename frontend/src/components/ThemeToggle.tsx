import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "../contexts/ThemeContext";
import { useLocalization } from "../contexts/LocalizationContext";

const ToggleContainer = styled.div`
  position: relative;
  width: 64px;
  height: 32px;
  background: var(--toggle-background);
  border-radius: 16px;
  cursor: pointer;
  padding: 3px;
  border: 1px solid var(--border-color);
`;

const getSliderPosition = (position: "light" | "auto" | "dark"): string => {
  switch (position) {
    case "light":
      return "0";
    case "auto":
      return "16px";
    case "dark":
      return "32px";
    default:
      return "0";
  }
};

const Slider = styled.div<{ position: "light" | "auto" | "dark" }>`
  position: absolute;
  width: 26px;
  height: 26px;
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
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.8-6.8L15.8 6.6M8.2 15.4L6.8 16.8M6.8 7.2L8.2 8.6m9.6 6.8l1.4 1.4" />
  </svg>
);

const SystemIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
  </svg>
);

const MoonIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
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
