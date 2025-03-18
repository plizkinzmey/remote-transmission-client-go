import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import ReactCountryFlag from "react-country-flag";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";

const languageToCountryCode: Record<string, string> = {
  en: "GB",
  ru: "RU",
};

const StyledTrigger = styled(DropdownMenu.Trigger)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 8px;
  margin: 0;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  color: var(--header-button-icon);
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:focus {
    outline: none;
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.15);
  }
`;

const StyledContent = styled(DropdownMenu.Content)`
  z-index: 99999;
  min-width: 150px;
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);
  animation: scaleIn 0.1s ease-out;

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const StyledItem = styled(DropdownMenu.Item)`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
  outline: none;
  border-radius: 4px;

  &:hover {
    background: var(--background-hover);
  }

  &:focus {
    outline: none;
    background: var(--background-hover);
  }

  .flag {
    margin-right: 8px;
    flex-shrink: 0;
  }

  .text {
    flex: 1;
  }

  .check {
    margin-left: 8px;
    flex-shrink: 0;
  }
`;

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } = useLocalization();

  return (
    <DropdownMenu.Root>
      <StyledTrigger aria-label="Select language">
        <ReactCountryFlag
          countryCode={languageToCountryCode[currentLanguage] || "GB"}
          svg
          style={{ width: "20px", height: "20px" }}
        />
      </StyledTrigger>
      
      <DropdownMenu.Portal>
        <StyledContent align="end" sideOffset={5}>
          {availableLanguages.map((lang) => (
            <StyledItem
              key={lang.code}
              onSelect={() => setLanguage(lang.code)}
            >
              <ReactCountryFlag
                countryCode={languageToCountryCode[lang.code] || "GB"}
                svg
                style={{ width: "20px", height: "20px" }}
                className="flag"
              />
              <span className="text">{lang.name}</span>
              {currentLanguage === lang.code && (
                <span className="check">✓</span>
              )}
            </StyledItem>
          ))}
        </StyledContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
