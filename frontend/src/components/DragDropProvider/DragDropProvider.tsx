import React, { useState, ReactNode } from "react";
import { useLocalization } from "../../contexts/LocalizationContext";
import styles from "./DragDropProvider.module.css";

/**
 * Пропсы для компонента DragDropProvider
 * @interface DragDropProviderProps
 */
export interface DragDropProviderProps {
  /** Дочерние элементы компонента */
  children: ReactNode;

  /** 
   * Функция обратного вызова, вызываемая при сбросе торрент-файла 
   * @param fileName - Имя сброшенного файла
   * @param fileData - Содержимое файла в формате base64
   */
  onFileDropped: (fileName: string, fileData: string) => void;
}

/**
 * Компонент для обработки перетаскивания торрент-файлов
 * Оборачивает содержимое приложения и добавляет функциональность drag&drop
 * для загрузки торрент-файлов
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
      className={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="drag-drop-container"
    >
      {isDragging && (
        <div className={styles.dragOverlay} data-testid="drag-overlay">
          <div className={styles.dropIndicator} data-testid="drop-indicator">
            {t("add.dropTorrentHere")}
          </div>
        </div>
      )}
      {children}
    </div>
  );
};