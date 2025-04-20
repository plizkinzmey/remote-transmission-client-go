import React, { useState, useRef, useEffect } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { FolderIcon } from "@heroicons/react/24/outline";
import { useLocalization } from "@contexts/LocalizationContext";
import { ReadFile } from "../../../../wailsjs/go/main/App";
import "./TorrentFileTab.css";

interface TorrentFileTabProps {
  onFileSelect: (fileName: string, data: string) => void;
  torrentFilePath?: string;
  torrentFileData?: {
    name: string;
    data: string;
  };
}

export const TorrentFileTab: React.FC<TorrentFileTabProps> = ({
  onFileSelect,
  torrentFilePath,
  torrentFileData,
}) => {
  const { t } = useLocalization();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [selectedFileData, setSelectedFileData] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (torrentFileData) {
      setSelectedFileName(torrentFileData.name);
      setSelectedFileData(torrentFileData.data);
      onFileSelect(torrentFileData.name, torrentFileData.data);
    }
  }, [torrentFileData, onFileSelect]);

  useEffect(() => {
    if (torrentFilePath) {
      const parts = torrentFilePath.split(/[\\/]/);
      const fileName = parts[parts.length - 1];
      setSelectedFileName(fileName);

      // Используем Wails API для чтения файла
      ReadFile(torrentFilePath)
        .then((base64Content: string) => {
          setSelectedFileData(base64Content);
          onFileSelect(fileName, base64Content);
        })
        .catch((error: Error) => {
          console.error("Ошибка при чтении файла через Wails API:", error);
        });
    }
  }, [torrentFilePath, onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      onFileSelect(file.name, base64Data);
    };
    reader.readAsDataURL(file);
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

  return (
    <Flex direction="column" gap="2">
      <div
        className={`file-input-area ${isDragOver ? "drag-over" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
      </div>

      {selectedFileName && (
        <Box className="selected-file">
          <Text size="2">{selectedFileName}</Text>
        </Box>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".torrent"
        onChange={handleFileChange}
        style={{ display: "none" }}
        data-testid="file-input"
      />
    </Flex>
  );
};
