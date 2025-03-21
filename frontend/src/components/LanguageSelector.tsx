import React from "react";
import { CircleFlag } from "react-circle-flags";
import { IconButton, DropdownMenu, Flex, Text } from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";

const languageToCountryCode: Record<string, string> = {
  en: "gb",
  ru: "ru",
};

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } =
    useLocalization();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <IconButton
          size="2"
          variant="soft"
          color="gray"
          aria-label="Select language"
        >
          <CircleFlag
            countryCode={languageToCountryCode[currentLanguage] || "gb"}
            width={18}
            height={18}
          />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content>
        {availableLanguages.map((lang) => (
          <DropdownMenu.Item
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
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
