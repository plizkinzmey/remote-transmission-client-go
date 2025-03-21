import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { CircleFlag } from "react-circle-flags";
import { IconButton, Box } from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";
import styles from "../styles/LanguageSelector.module.css";

const languageToCountryCode: Record<string, string> = {
  en: "gb",
  ru: "ru",
};

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } =
    useLocalization();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton variant="ghost" aria-label="Select language">
          <CircleFlag
            countryCode={languageToCountryCode[currentLanguage] || "gb"}
            width={18}
            height={18}
          />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="radix-dropdown-content"
          align="end"
          sideOffset={5}
          style={{
            backgroundColor: "var(--gray-1)",
            border: "1px solid var(--gray-5)",
            borderRadius: "6px",
            padding: "4px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
            minWidth: "150px",
            zIndex: 1000,
          }}
        >
          {availableLanguages.map((lang) => (
            <DropdownMenu.Item
              key={lang.code}
              onSelect={() => setLanguage(lang.code)}
              className={styles.languageItem}
            >
              <Box>
                <CircleFlag
                  countryCode={languageToCountryCode[lang.code] || "gb"}
                  width={18}
                  height={18}
                />
              </Box>
              <span>{lang.name}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
