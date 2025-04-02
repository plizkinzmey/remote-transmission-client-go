import React, { useState } from "react";
import { CircleFlag } from "react-circle-flags";
import { IconButton, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";

const languageToCountryCode: Record<string, string> = {
  en: "gb",
  ru: "ru",
};

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } =
    useLocalization();
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
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          size="2"
          variant="soft"
          color="gray"
          aria-label="Select language"
          disabled={changingLanguage}
        >
          {changingLanguage ? (
            <LoadingSpinner size="small" />
          ) : (
            <CircleFlag
              countryCode={languageToCountryCode[currentLanguage] || "gb"}
              width={18}
              height={18}
            />
          )}
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {availableLanguages.map((lang) => (
          <DropdownMenu.Item
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={changingLanguage || lang.code === currentLanguage}
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
  );
};
