import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CircleFlag } from "react-circle-flags";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";

const languageToCountryCode: Record<string, string> = {
  en: "gb",
  ru: "ru",
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
  border-radius: 50%;
  background-color: var(--header-button-bg);
  color: var(--header-button-icon);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--header-button-hover-bg);
  }

  &:focus {
    outline: none;
  }

  .rt-dark & {
    --header-button-hover-bg: rgba(255, 255, 255, 0.1);
  }

  .rt-light & {
    --header-button-hover-bg: rgba(0, 0, 0, 0.1);
  }
`;

const StyledContent = styled(DropdownMenu.Content)`
  min-width: 150px;
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 4px;
  box-shadow: var(--shadow-5);
`;

const StyledItem = styled(DropdownMenu.Item)`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  color: var(--color-text);
  cursor: pointer;
  user-select: none;
  outline: none;
  gap: 8px;

  &:hover {
    background: var(--color-surface-hover);
  }

  &:focus {
    background: var(--color-surface-hover);
  }
`;

const FlagContainer = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } =
    useLocalization();

  return (
    <DropdownMenu.Root>
      <StyledTrigger aria-label="Select language">
        <FlagContainer>
          <CircleFlag
            countryCode={languageToCountryCode[currentLanguage] || "gb"}
            width={20}
            height={20}
          />
        </FlagContainer>
      </StyledTrigger>

      <DropdownMenu.Portal>
        <StyledContent align="end" sideOffset={5}>
          {availableLanguages.map((lang) => (
            <StyledItem key={lang.code} onSelect={() => setLanguage(lang.code)}>
              <CircleFlag
                countryCode={languageToCountryCode[lang.code] || "gb"}
                width={20}
                height={20}
              />
              <span>{lang.name}</span>
            </StyledItem>
          ))}
        </StyledContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
