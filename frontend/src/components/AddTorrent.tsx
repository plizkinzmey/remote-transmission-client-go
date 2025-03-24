import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  Button,
  Tabs,
  Flex,
  Text,
  Box,
  TextField,
  Select,
  IconButton,
} from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { FolderIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Portal } from "./Portal";
import {
  GetDownloadPaths,
  ValidateDownloadPath,
  RemoveDownloadPath,
} from "../../wailsjs/go/main/App";

export interface AddTorrentProps {
  onAdd: (url: string, downloadDir?: string) => Promise<boolean>;
  onAddFile: (base64Content: string, downloadDir?: string) => Promise<boolean>;
  onClose: () => void;
  torrentFile?: string; // добавлено для передачи пути торрент файла
}

const FileInputArea = ({
  isDragOver,
  ...props
}: { isDragOver?: boolean } & React.HTMLAttributes<HTMLDivElement>) => (
  <Box
    {...props}
    style={{
      border: "2px dashed var(--gray-6)",
      borderRadius: "8px",
      padding: "24px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s ease",
      background: isDragOver ? "var(--gray-3)" : "transparent",
    }}
    onMouseEnter={(e) => {
      const target = e.currentTarget as HTMLDivElement;
      target.style.borderColor = "var(--accent-9)";
      target.style.background = "var(--gray-3)";
    }}
    onMouseLeave={(e) => {
      const target = e.currentTarget as HTMLDivElement;
      target.style.borderColor = "var(--gray-6)";
      target.style.background = isDragOver ? "var(--gray-3)" : "transparent";
    }}
  />
);

export const AddTorrent: React.FC<AddTorrentProps> = ({
  onAdd,
  onAddFile,
  onClose,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileData, setSelectedFileData] = useState<string>("");
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
          setDownloadPath(paths[0]);
          setDefaultPath(paths[0]); // Сохраняем путь по умолчанию
        }

        setIsLoadingPaths(false);
      } catch (error) {
        console.error("Ошибка при получении путей:", error);
        setIsLoadingPaths(false);
      }
    };

    fetchPaths();
  }, []);

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
        setDownloadPath(paths[0]);
      }
    } catch (error) {
      console.error("Ошибка при удалении пути:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pathToUse = showCustomPath && customPath ? customPath : downloadPath;

    // Валидация пути перед отправкой
    const isValid = await validatePath(pathToUse);
    if (!isValid) {
      return;
    }

    if (activeTab === "url" && url.trim()) {
      onAdd(url.trim(), pathToUse);
      onClose();
    } else if (activeTab === "file" && selectedFileData) {
      onAddFile(selectedFileData, pathToUse);
      onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result as string;
      const base64Data = base64Content.split(",")[1];
      setSelectedFileData(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handlePathChange = async (path: string) => {
    setDownloadPath(path);
    await validatePath(path);
  };

  const handleCustomPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCustomPath(path);
    if (path) {
      validatePath(path);
    } else {
      setPathError("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name?.endsWith(".torrent")) {
      handleFile(file);
    }
  };

  const handleCustomPathToggle = () => {
    setShowCustomPath(!showCustomPath);
    if (!showCustomPath) {
      // При включении кастомного пути копируем текущий выбранный путь
      setCustomPath(downloadPath);
    }
  };

  return (
    <Portal>
      <Dialog.Root open onOpenChange={() => onClose()}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title mb="4">{t("add.title")}</Dialog.Title>
          {isLocalizationLoading || isLoadingPaths ? (
            <Flex justify="center" p="6">
              <LoadingSpinner size="medium" />
            </Flex>
          ) : (
            <form onSubmit={handleSubmit}>
              <Tabs.Root
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "url" | "file")}
              >
                <Tabs.List>
                  <Tabs.Trigger
                    value="url"
                    style={{
                      whiteSpace: "normal",
                      minHeight: "32px",
                      height: "auto",
                    }}
                  >
                    {t("add.url")}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="file"
                    style={{
                      whiteSpace: "normal",
                      minHeight: "32px",
                      height: "auto",
                    }}
                  >
                    {t("add.file")}
                  </Tabs.Trigger>
                </Tabs.List>
                <Box mt="4">
                  <Tabs.Content value="url">
                    <TextField.Root
                      size="1"
                      placeholder="magnet:?xt=urn:btih:..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </Tabs.Content>
                  <Tabs.Content value="file">
                    <Flex direction="column" gap="2">
                      <FileInputArea
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        isDragOver={isDragOver}
                      >
                        <FolderIcon
                          style={{
                            width: "32px",
                            height: "32px",
                            color: "var(--gray-9)",
                            margin: "0 auto 12px",
                          }}
                        />
                        <Text as="div" size="2" mb="1">
                          {t("add.dropFile")}
                        </Text>
                        <Text as="div" size="1" color="gray">
                          {t("add.orClickToSelect")}
                        </Text>
                      </FileInputArea>
                      {selectedFileName && (
                        <Box
                          mt="2"
                          p="2"
                          style={{
                            background: "var(--gray-3)",
                            borderRadius: "6px",
                          }}
                        >
                          <Text size="2">{selectedFileName}</Text>
                        </Box>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".torrent"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                    </Flex>
                  </Tabs.Content>
                </Box>

                {/* Раздел выбора директории загрузки */}
                <Box mt="4">
                  <Text as="div" size="2" mb="2" weight="bold">
                    {t("add.downloadPath")}
                  </Text>

                  <Flex direction="column" gap="2">
                    {!showCustomPath ? (
                      <Select.Root
                        value={downloadPath}
                        onValueChange={handlePathChange}
                      >
                        <Select.Trigger />
                        <Select.Content>
                          {downloadPaths.map((path) => (
                            <Flex key={path} justify="between" align="center">
                              <Select.Item value={path}>{path}</Select.Item>
                              {path !== defaultPath && (
                                <IconButton
                                  size="1"
                                  variant="soft"
                                  color="red"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemovePath(path);
                                  }}
                                >
                                  <TrashIcon width={16} height={16} />
                                </IconButton>
                              )}
                            </Flex>
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
                      />
                    )}

                    <Button
                      type="button"
                      size="1"
                      variant="soft"
                      onClick={handleCustomPathToggle}
                    >
                      {showCustomPath
                        ? t("add.selectFromExisting")
                        : t("add.enterCustomPath")}
                    </Button>

                    {pathError && (
                      <Text color="red" size="2">
                        {pathError}
                      </Text>
                    )}
                  </Flex>
                </Box>
              </Tabs.Root>
              <Flex justify="end" gap="3" mt="4">
                <Button size="1" variant="soft" onClick={onClose}>
                  {t("add.cancel")}
                </Button>
                <Button
                  size="1"
                  type="submit"
                  disabled={
                    (activeTab === "url" && !url.trim()) ||
                    (activeTab === "file" && !selectedFileData)
                  }
                >
                  {t("add.add")}
                </Button>
              </Flex>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </Portal>
  );
};
