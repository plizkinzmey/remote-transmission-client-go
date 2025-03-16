import React, { useState, useEffect } from "react";
import { useLocalization } from "../contexts/LocalizationContext";
import { Button } from "./Button";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import styled from "@emotion/styled";
import styles from "../styles/TorrentContent.module.css";
import { GetTorrentFiles, SetFilesWanted } from "../../wailsjs/go/main/App";

interface TorrentContentProps {
  id: number;
  name: string;
  onClose: () => void;
}

interface TorrentFile {
  ID: number;
  Name: string;
  Path: string;
  Size: number;
  Progress: number;
  Wanted: boolean;
}

// Styled components
const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--background-primary);
  z-index: 1000;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
`;

const Title = styled.h2`
  margin: 0;
  color: var(--text-primary);
  font-size: 1.5rem;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileItem = styled.div<{ isChecked: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--background-secondary);
  border-radius: 8px;
  color: var(--text-primary);
  opacity: ${(props) => (props.isChecked ? 1 : 0.6)};
`;

const Checkbox = styled.input`
  margin-right: 12px;
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const FileName = styled.span`
  flex: 1;
`;

const FileProgress = styled.div<{ progress: number }>`
  width: 100px;
  height: 4px;
  background-color: var(--background-tertiary);
  border-radius: 2px;
  margin: 0 12px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${(props) => props.progress}%;
    background-color: var(--accent-color);
    border-radius: 2px;
  }
`;

const FileSize = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-left: 8px;
`;

export const TorrentContent: React.FC<TorrentContentProps> = ({
  id,
  name,
  onClose,
}) => {
  const { t } = useLocalization();
  const [files, setFiles] = useState<TorrentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка списка файлов
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await GetTorrentFiles(id);
      setFiles(data);
    } catch (err) {
      console.error("Failed to load torrent files:", err);
      setError(t("errors.failedToLoadFiles", String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [id]);

  // Обработка изменения выбора файла
  const handleFileToggle = async (fileId: number, checked: boolean) => {
    try {
      await SetFilesWanted(id, [fileId], checked);
      // Обновляем состояние локально
      setFiles((prev) =>
        prev.map((file) =>
          file.ID === fileId ? { ...file, Wanted: checked } : file
        )
      );
    } catch (err) {
      console.error("Failed to update file state:", err);
      setError(t("errors.failedToUpdateFile", String(err)));
    }
  };

  const formatSize = (size: number) => {
    const units = ["B", "KiB", "MiB", "GiB", "TiB"];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles["loading-container"]}>
          <ArrowPathIcon className={styles["loading-spinner"]} />
          <div className={styles["loading-text"]}>{t("torrent.loadingFiles")}</div>
        </div>
      );
    }

    if (error) {
      return <div className={styles["error-message"]}>{error}</div>;
    }

    return (
      <FileList>
        {files.map((file) => (
          <FileItem key={file.ID} isChecked={file.Wanted}>
            <Checkbox
              type="checkbox"
              checked={file.Wanted}
              onChange={(e) => handleFileToggle(file.ID, e.target.checked)}
            />
            <FileName>{file.Name}</FileName>
            <FileProgress progress={file.Progress} />
            <FileSize>{formatSize(file.Size)}</FileSize>
          </FileItem>
        ))}
      </FileList>
    );
  };

  return (
    <Container>
      <Header>
        <Title>{name}</Title>
        <Button variant="icon" onClick={onClose} aria-label={t("common.close")}>
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </Header>

      <Content>
        {renderContent()}
      </Content>
    </Container>
  );
};