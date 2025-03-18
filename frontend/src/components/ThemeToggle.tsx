import React from "react";
import styled from "@emotion/styled";
import { useTheme } from "../contexts/ThemeContext";
import { useLocalization } from "../contexts/LocalizationContext";

const ToggleContainer = styled.div`
  position: relative;
  display: inline-flex;
  background: var(--toggle-background);
  border-radius: 20px;
  padding: 2px;
  gap: 2px;
  height: 24px;
  border: 1px solid var(--border-color);
`;

const ToggleOption = styled.button<{ isActive: boolean }>`
  border: none;
  background: ${(props) =>
    props.isActive ? "var(--button-active-background)" : "transparent"};
  color: ${(props) =>
    props.isActive ? "var(--button-active-text)" : "var(--text-secondary)"};
  padding: 2px 8px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${(props) =>
      !props.isActive && "var(--button-hover-background)"};
  }

  svg {
    width: 14px;
    height: 14px;
    margin-right: 4px;
  }
`;

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.8-6.8L15.8 6.6M8.2 15.4L6.8 16.8M6.8 7.2L8.2 8.6m9.6 6.8l1.4 1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SystemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 4v16" />
    <path d="M4 12h16" />
  </svg>
);

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

  return (
    <ToggleContainer>
      <ToggleOption
        isActive={theme === "light"}
        onClick={() => setTheme("light")}
        title={t("settings.themeLight")}
      >
        <SunIcon />
      </ToggleOption>
      <ToggleOption
        isActive={theme === "auto"}
        onClick={() => setTheme("auto")}
        title={t("settings.themeAuto")}
      >
        <SystemIcon />
      </ToggleOption>
      <ToggleOption
        isActive={theme === "dark"}
        onClick={() => setTheme("dark")}
        title={t("settings.themeDark")}
      >
        <MoonIcon />
      </ToggleOption>
    </ToggleContainer>
  );
};
