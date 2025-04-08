import React, { useState, useEffect } from "react";
import { Box, Text, Select, TextField, Button, Flex } from "@radix-ui/themes";
import { useLocalization } from "../../../contexts/LocalizationContext";
import {
  GetDownloadPaths,
  ValidateDownloadPath,
  RemoveDownloadPath,
} from "../../../../wailsjs/go/main/App";
import "./DownloadPathSelector.css";

interface DownloadPathSelectorProps {
  onPathChange: (path: string) => void;
  initialPath?: string;
  onLoadingStateChange?: (isLoading: boolean) => void; // Новый проп для отслеживания состояния загрузки
}

export const DownloadPathSelector: React.FC<DownloadPathSelectorProps> = ({
  onPathChange,
  initialPath,
  onLoadingStateChange,
}) => {
  const { t } = useLocalization();
  const [downloadPath, setDownloadPath] = useState<string>("");
  const [downloadPaths, setDownloadPaths] = useState<string[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(true);
  const [customPath, setCustomPath] = useState<string>("");
  const [showCustomPath, setShowCustomPath] = useState<boolean>(false);
  const [pathError, setPathError] = useState<string>("");
  const [defaultPath, setDefaultPath] = useState<string>("");

  // Получаем список путей при инициализации
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const paths = await GetDownloadPaths();
        setDownloadPaths(paths);

        if (paths.length > 0) {
          const pathToSet = initialPath || paths[0];
          setDownloadPath(pathToSet);
          setDefaultPath(paths[0]); // Сохраняем путь по умолчанию
          onPathChange(pathToSet);
        }

        setIsLoadingPaths(false);
        // Сообщаем родительскому компоненту о завершении загрузки
        if (onLoadingStateChange) {
          onLoadingStateChange(false);
        }
      } catch (error) {
        console.error("Ошибка при получении путей:", error);
        setIsLoadingPaths(false);
        // Сообщаем родительскому компоненту о завершении загрузки даже в случае ошибки
        if (onLoadingStateChange) {
          onLoadingStateChange(false);
        }
      }
    };

    fetchPaths();
  }, [initialPath, onPathChange, onLoadingStateChange]);

  // Валидация пути при его изменении
  const validatePath = async (path: string) => {
    try {
      await ValidateDownloadPath(path);
      setPathError("");
      return true;
    } catch (error) {
      setPathError(String(error));
      return false;
    }
  };

  const handleRemovePath = async (pathToRemove: string) => {
    try {
      await RemoveDownloadPath(pathToRemove);
      // Обновляем список путей
      const paths = await GetDownloadPaths();
      setDownloadPaths(paths);

      // Если удалили текущий путь, выбираем первый из оставшихся
      if (pathToRemove === downloadPath && paths.length > 0) {
        const newPath = paths[0];
        setDownloadPath(newPath);
        onPathChange(newPath);
      }
    } catch (error) {
      console.error("Ошибка при удалении пути:", error);
    }
  };

  const handlePathChange = async (path: string) => {
    setDownloadPath(path);
    onPathChange(path);
    await validatePath(path);
  };

  const handleCustomPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCustomPath(path);

    if (path) {
      validatePath(path).then((isValid) => {
        if (isValid) {
          onPathChange(path);
        }
      });
    } else {
      setPathError("");
    }
  };

  const handleCustomPathToggle = () => {
    const newShowCustomPath = !showCustomPath;
    setShowCustomPath(newShowCustomPath);

    if (newShowCustomPath) {
      // При включении кастомного пути копируем текущий выбранный путь
      setCustomPath(downloadPath);
    } else {
      // При выключении возвращаемся к выбранному пути
      onPathChange(downloadPath);
    }
  };

  if (isLoadingPaths) {
    return null; // будет обработано родительским компонентом
  }

  return (
    <Box>
      <Text as="div" size="2" mb="2" weight="bold">
        {t("add.downloadPath")}
      </Text>

      <Flex direction="column" gap="2">
        {!showCustomPath ? (
          <Select.Root
            value={downloadPath}
            onValueChange={handlePathChange}
            size="1"
            data-testid="path-select"
          >
            <Select.Trigger data-testid="select-trigger" />
            <Select.Content>
              {downloadPaths.map((path) => (
                <Select.Item
                  key={path}
                  value={path}
                  className="select-item"
                  data-testid={`path-option-${path}`}
                >
                  {path}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        ) : (
          <TextField.Root
            size="1"
            placeholder="/path/to/downloads"
            value={customPath}
            onChange={handleCustomPathChange}
            color={pathError ? "red" : undefined}
            data-testid="custom-path-input"
          />
        )}

        <Button
          type="button"
          size="1"
          variant="soft"
          onClick={handleCustomPathToggle}
          data-testid="toggle-path-mode-button"
        >
          {showCustomPath
            ? t("add.selectFromExisting")
            : t("add.enterCustomPath")}
        </Button>

        {pathError && (
          <Text color="red" size="2" className="path-error">
            {pathError}
          </Text>
        )}
      </Flex>
    </Box>
  );
};
