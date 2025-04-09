import React, { useState, useEffect } from "react";
import { Dialog, Button, Tabs, Flex, Box } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { Portal } from "../Portal";
import { TorrentUrlTab } from "./TorrentUrlTab/TorrentUrlTab";
import { TorrentFileTab } from "./TorrentFileTab/TorrentFileTab";
import { DownloadPathSelector } from "./DownloadPathSelector/DownloadPathSelector";
import { ValidateDownloadPath } from "../../../wailsjs/go/main/App";
import "./AddTorrent.css";

export interface AddTorrentProps {
  onAdd: (url: string, downloadDir?: string) => Promise<boolean>;
  onAddFile: (base64Content: string, downloadDir?: string) => Promise<boolean>;
  onClose: () => void;
  torrentFile?: string; // путь к торрент-файлу
  torrentFileData?: {
    name: string;
    data: string;
  }; // данные торрент-файла (для перетаскивания)
}

export const AddTorrent: React.FC<AddTorrentProps> = ({
  onAdd,
  onAddFile,
  onClose,
  torrentFile,
  torrentFileData,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileData, setSelectedFileData] = useState<string>("");
  const [downloadPath, setDownloadPath] = useState<string>("");
  const [pathError, setPathError] = useState<string>("");

  // Обработчик для получения URL из компонента TorrentUrlTab
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  // Обработчик для получения файла из компонента TorrentFileTab
  const handleFileSelect = (fileName: string, fileData: string) => {
    setSelectedFileName(fileName);
    setSelectedFileData(fileData);
  };

  // Обработчик для получения пути из компонента DownloadPathSelector
  const handlePathChange = (path: string) => {
    setDownloadPath(path);
  };

  // Валидация пути перед отправкой
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем, есть ли путь для валидации
    if (downloadPath) {
      // Валидация пути перед отправкой
      const isValid = await validatePath(downloadPath);
      if (!isValid) {
        return;
      }
    }

    if (activeTab === "url" && url.trim()) {
      onAdd(url.trim(), downloadPath);
      onClose();
    } else if (activeTab === "file" && selectedFileData) {
      onAddFile(selectedFileData, downloadPath);
      onClose();
    }
  };

  // Если torrentFile или torrentFileData переданы, переключаем вкладку
  useEffect(() => {
    if (torrentFile || torrentFileData) {
      setActiveTab("file");
    }
  }, [torrentFile, torrentFileData]);

  // Показываем индикатор загрузки только для локализации
  if (isLocalizationLoading) {
    return (
      <Portal>
        <Dialog.Root open onOpenChange={onClose}>
          <Dialog.Content
            data-testid="add-torrent-modal"
            className="dialog-content"
          >
            <Dialog.Title mb="4">
              {t("add.title") || "Add Torrent"}
            </Dialog.Title>
            <Dialog.Description>
              {t("add.loading") || "Loading..."}
            </Dialog.Description>
            <Flex justify="center" p="6">
              <LoadingSpinner size="medium" />
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Portal>
    );
  }

  return (
    <Portal>
      <Dialog.Root open onOpenChange={() => onClose()}>
        <Dialog.Content
          data-testid="add-torrent-modal"
          className="dialog-content"
        >
          <Dialog.Title mb="4">{t("add.title")}</Dialog.Title>
          <Dialog.Description>
            {t("add.description") || "Add a new torrent from URL or file"}
          </Dialog.Description>
          <form onSubmit={handleSubmit}>
            <Tabs.Root
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as "url" | "file")}
            >
              <Tabs.List>
                <Tabs.Trigger value="url" className="tabs-trigger">
                  {t("add.url")}
                </Tabs.Trigger>
                <Tabs.Trigger value="file" className="tabs-trigger">
                  {t("add.file")}
                </Tabs.Trigger>
              </Tabs.List>
              <Box mt="4">
                <Tabs.Content value="url">
                  <TorrentUrlTab
                    onUrlChange={handleUrlChange}
                    initialUrl={url}
                  />
                </Tabs.Content>
                <Tabs.Content value="file">
                  <TorrentFileTab
                    onFileSelect={handleFileSelect}
                    torrentFilePath={torrentFile}
                    torrentFileData={torrentFileData}
                  />
                </Tabs.Content>
              </Box>

              {/* Раздел выбора директории загрузки */}
              <Box mt="4">
                <DownloadPathSelector
                  onPathChange={handlePathChange}
                  initialPath={downloadPath}
                />

                {pathError && <Box className="path-error">{pathError}</Box>}
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
        </Dialog.Content>
      </Dialog.Root>
    </Portal>
  );
};
