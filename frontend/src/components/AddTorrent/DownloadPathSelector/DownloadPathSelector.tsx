import React, { useState, useEffect, useCallback } from "react";
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
  onLoadingStateChange?: (isLoading: boolean) => void;
  testRef?: React.MutableRefObject<{
    handleRemovePath?: (path: string) => Promise<void>;
    validatePath?: (path: string) => Promise<boolean>;
  }>;
}

export const DownloadPathSelector: React.FC<DownloadPathSelectorProps> = ({
  onPathChange,
  initialPath,
  onLoadingStateChange,
  testRef,
}) => {
  const { t } = useLocalization();
  const [downloadPath, setDownloadPath] = useState<string>("");
  const [downloadPaths, setDownloadPaths] = useState<string[]>([]);
  const [isLoadingPaths, setIsLoadingPaths] = useState<boolean>(true);
  const [customPath, setCustomPath] = useState<string>("");
  const [showCustomPath, setShowCustomPath] = useState<boolean>(false);
  const [pathError, setPathError] = useState<string>("");
  const [defaultPath, setDefaultPath] = useState<string>("");

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

    return () => {
      isMounted = false;
    };
  }, [initialPath, onPathChange, onLoadingStateChange]);

  const validatePathInternal = useCallback(async (path: string): Promise<void> => {
    await ValidateDownloadPath(path);
  }, [ValidateDownloadPath]);

  const validatePath = useCallback(
    async (path: string): Promise<boolean> => {
      if (!path) {
        setPathError("");
        return false;
      }

      try {
        await validatePathInternal(path);
        setPathError("");
        return true;
      } catch (error) {
        console.error("Ошибка валидации пути:", error);
        // Удаляем префикс "Error: " для более чистого отображения в UI
        setPathError(String(error).replace(/^Error:\s*/, ""));
        return false;
      }
    },
    [validatePathInternal, setPathError]
  );

  const handleRemovePath = useCallback(
    async (pathToRemove: string) => {
      try {
        await RemoveDownloadPath(pathToRemove);
        const paths = await GetDownloadPaths();
        setDownloadPaths(paths);

        if (pathToRemove === downloadPath) {
          const newPath = paths.length > 0 ? paths[0] : "";
          setDownloadPath(newPath);
          onPathChange(newPath);
          await validatePath(newPath);
        }
      } catch (error) {
        console.error("Ошибка при удалении пути:", error);
      }
    },
    [downloadPath, onPathChange, validatePath, setDownloadPaths, setDownloadPath]
  );

  useEffect(() => {
    if (testRef) {
      testRef.current = {
        handleRemovePath,
        validatePath,
      };
    }
    return () => {
      if (testRef) {
        testRef.current = {};
      }
    };
  }, [testRef, handleRemovePath, validatePath]);

  const handlePathChange = async (path: string) => {
    setDownloadPath(path);
    onPathChange(path);
    await validatePath(path);
  };

  const handleCustomPathChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCustomPath(path);
    onPathChange(path);
    await validatePath(path);
  };

  const handleCustomPathToggle = () => {
    const newShowCustomPath = !showCustomPath;
    setShowCustomPath(newShowCustomPath);

    if (newShowCustomPath) {
      setCustomPath(downloadPath);
    } else {
      onPathChange(downloadPath);
    }
  };

  if (isLoadingPaths) {
    return null;
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
