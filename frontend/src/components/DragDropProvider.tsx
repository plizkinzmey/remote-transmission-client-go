import React, { useState, ReactNode } from "react";
import { useLocalization } from "../contexts/LocalizationContext";
import styles from "../styles/App.module.css";

interface DragDropProviderProps {
  children: ReactNode;
  onFileDropped: (fileName: string, fileData: string) => void;
}

/**
 * Компонент для обработки перетаскивания торрент-файлов
 */
export const DragDropProvider: React.FC<DragDropProviderProps> = ({
  children,
  onFileDropped,
}) => {
  const { t } = useLocalization();
  const [isDragging, setIsDragging] = useState(false);

  // Обработчик события при перетаскивании файла над окном программы
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  // Обработчик события при уходе перетаскиваемого файла из окна программы
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Проверяем, что курсор действительно покинул область окна
    // Используем координаты события для более надежного определения
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Если курсор находится за пределами элемента, сбрасываем состояние
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  // Обработчик события при сбросе файла в окно программы
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const torrentFile = files.find((file) => file.name.endsWith(".torrent"));

    if (torrentFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = reader.result as string;
        const base64Data = base64Content.split(",")[1];

        // Передаем данные файла в родительский компонент
        onFileDropped(torrentFile.name, base64Data);
      };
      reader.readAsDataURL(torrentFile);
    }
  };

  return (
    <div
      className={styles.appContainer}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className={styles.dragOverlay}>
          <div className={styles.dropIndicator}>{t("add.dropTorrentHere")}</div>
        </div>
      )}
      {children}
    </div>
  );
};
