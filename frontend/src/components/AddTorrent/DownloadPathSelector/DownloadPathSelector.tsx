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
    let isMounted = true;

    const fetchPaths = async () => {
      try {
        const paths = await GetDownloadPaths();
        if (!isMounted) return;

        setDownloadPaths(paths);

        if (paths.length > 0) {
          const pathToSet = initialPath || paths[0];
          setDownloadPath(pathToSet);
          setDefaultPath(paths[0]);
          onPathChange(pathToSet);
        }

        setIsLoadingPaths(false);
        if (onLoadingStateChange && isMounted) {
          onLoadingStateChange(false);
        }
      } catch (error) {
        console.error("Ошибка при получении путей:", error);
        if (!isMounted) return;

        setIsLoadingPaths(false);
        if (onLoadingStateChange) {
          onLoadingStateChange(false);
        }
      }
    };

    fetchPaths();

    // Функция очистки
    return () => {
      isMounted = false;
    };
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

  // Общая функция для валидации пути и обработки ошибок
  const validatePathAndHandleError = async (path: string) => {
    if (!path) {
      setPathError("");
      return;
    }

    try {
      const isValid = await validatePath(path);
      // При успешной валидации setPathError("") вызывается в функции validatePath
      return isValid;
    } catch (error) {
      // Логируем ошибку для целей отладки
      console.error("Ошибка валидации пути:", error);

      // Дополнительная защита: если по какой-то причине ошибка не была обработана в validatePath,
      // всё равно обновляем UI
      if (!pathError) {
        setPathError(String(error));
      }
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
    await validatePathAndHandleError(path);
  };

  const handleCustomPathChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCustomPath(path);

    // Всегда обновляем путь в родительском компоненте
    onPathChange(path);

    // Выполняем валидацию, но только для отображения сообщения об ошибке
    if (path) {
      await validatePathAndHandleError(path);
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
