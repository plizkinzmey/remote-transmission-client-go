import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { useLocalization } from "../contexts/LocalizationContext";
import styles from "../styles/App.module.css";

interface ConnectionStatusProps {
  isReconnecting: boolean;
}

/**
 * Компонент для отображения статуса соединения
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isReconnecting,
}) => {
  const { t } = useLocalization();

  if (!isReconnecting) {
    return null;
  }

  return (
    <div className={styles.connectionStatus}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <LoadingSpinner size="medium" />
        <p>{t("errors.timeoutExplanation")}</p>
      </div>
    </div>
  );
};
