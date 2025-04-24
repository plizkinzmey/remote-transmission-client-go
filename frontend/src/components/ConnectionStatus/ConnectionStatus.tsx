import React from "react";
import { LoadingSpinner } from "../LoadingSpinner";
import { useLocalization } from "@contexts/LocalizationContext";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  isReconnecting: boolean;
  error: string | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isReconnecting,
  error,
}) => {
  const { t } = useLocalization();

  // Определяем, нужно ли рендерить компонент
  const shouldRender = isReconnecting || error;

  if (!shouldRender) {
    return null;
  }

  // Определяем сообщение и классы
  const message = error
    ? t(error)
    : t("errors.timeoutExplanation"); // Упрощено: если нет ошибки, значит идет реконнект

  const containerClasses = [styles.connectionStatus];
  if (error) {
    containerClasses.push(styles.error);
  }

  return (
    <div
      className={containerClasses.join(" ")} // Используем рассчитанные классы
      data-testid="connection-status-container"
    >
      <div className={styles.messageContainer}>
        {isReconnecting && <LoadingSpinner size="medium" data-testid="loading-spinner" />} {/* Добавлен data-testid для спиннера */}
        <p className={styles.message} data-testid="connection-status-message">
          {message}
        </p>
      </div>
    </div>
  );
};