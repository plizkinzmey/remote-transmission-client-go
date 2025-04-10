import React, { useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { IconButton, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import styles from "./LanguageSelector.module.css";

const languageToCountryCode: Record<string, string> = {
  en: "gb",
  ru: "ru",
};

/**
 * Компонент для выбора языка интерфейса приложения.
 * Отображает выпадающее меню с доступными языками и флагами стран.
 */
export interface LanguageSelectorProps {
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Компонент выбора языка интерфейса.
 * Отображает текущий выбранный язык в виде кнопки с флагом страны
 * и предоставляет выпадающее меню для выбора другого языка.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className }) => {
  const { currentLanguage, availableLanguages, setLanguage } = useLocalization();
  const [changingLanguage, setChangingLanguage] = useState(false);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode !== currentLanguage && !changingLanguage) {
      setChangingLanguage(true);
      try {
        await setLanguage(langCode);
      } finally {
        setChangingLanguage(false);
      }
    }
  };

  return (
    <div className={`${styles.container} ${className || ""}`} data-testid="language-selector-container">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton
            size="2"
            variant="soft"
            color="gray"
            aria-label="Select language"
            disabled={changingLanguage}
            className={styles.languageButton}
            data-testid="language-selector-button"
          >
            {changingLanguage ? (
              <LoadingSpinner size="small" data-testid="language-selector-spinner" />
            ) : (
              <div className={styles.flagContainer} data-testid="language-selector-flag">
                <CircleFlag
                  countryCode={languageToCountryCode[currentLanguage] || "gb"}
                  width={18}
                  height={18}
                />
              </div>
            )}
          </IconButton>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content data-testid="language-dropdown-content">
          {availableLanguages.map((lang) => (
            <DropdownMenu.Item
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              disabled={changingLanguage || lang.code === currentLanguage}
              className={styles.dropdownItem}
              data-testid={`language-item-${lang.code}`}
            >
              <Flex gap="2" align="center">
                <CircleFlag
                  countryCode={languageToCountryCode[lang.code] || "gb"}
                  width={18}
                  height={18}
                />
                <Text size="2">{lang.name}</Text>
              </Flex>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
};