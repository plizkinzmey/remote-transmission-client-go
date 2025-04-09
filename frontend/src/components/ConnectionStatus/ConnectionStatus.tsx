import React from "react";
import { LoadingSpinner } from "../LoadingSpinner";
import { useLocalization } from "../../contexts/LocalizationContext";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  /** Флаг, указывающий на попытку переподключения */
  isReconnecting: boolean;
}

/**
 * Компонент для отображения статуса соединения при потере связи с сервером
 * @param {ConnectionStatusProps} props - Свойства компонента
 * @returns {React.ReactElement | null} Элемент статуса подключения или null
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isReconnecting,
}) => {
  const { t } = useLocalization();

  if (!isReconnecting) {
    return null;
  }

  return (
    <div className={styles.connectionStatus} data-testid="connection-status-container">
      <div className={styles.messageContainer}>
        <LoadingSpinner size="medium" />
        <p className={styles.message} data-testid="connection-status-message">
          {t("errors.timeoutExplanation")}
        </p>
      </div>
    </div>
  );
};