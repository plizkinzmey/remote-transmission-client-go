import React from "react";
import { LoadingSpinner } from "../LoadingSpinner";
import { useLocalization } from "@contexts/LocalizationContext";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  /** Флаг, указывающий на попытку переподключения */
  isReconnecting: boolean;
  /** Сообщение об ошибке для отображения (может быть ключом локализации) */
  error: string | null;
}

/**
 * Компонент для отображения статуса соединения при потере связи или ошибке
 * @param {ConnectionStatusProps} props - Свойства компонента
 * @returns {React.ReactElement | null} Элемент статуса подключения или null
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isReconnecting,
  error,
}) => {
  const { t } = useLocalization();

  // Не отображаем, если нет ни реконнекта, ни ошибки
  if (!isReconnecting && !error) {
    return null;
  }

  // Определяем сообщение для отображения
  const message = error
    ? t(error) // Пытаемся перевести ошибку
    : isReconnecting
      ? t("errors.timeoutExplanation") // Сообщение по умолчанию для реконнекта
      : ""; // На всякий случай

  return (
    <div
      className={`${styles.connectionStatus} ${error ? styles.error : ""}`} // Добавляем класс ошибки
      data-testid="connection-status-container"
    >
      <div className={styles.messageContainer}>
        {isReconnecting && <LoadingSpinner size="medium" />}
        <p className={styles.message} data-testid="connection-status-message">
          {message}
        </p>
      </div>
    </div>
  );
};