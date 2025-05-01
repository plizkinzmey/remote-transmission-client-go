import { useState, useEffect, useCallback } from "react";
import { Initialize, LoadConfig } from "@wailsjs/go/main/App";
import { AppConfig } from "./types";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useNotification } from "@/hooks/useNotification"; // Импортируем хук уведомлений

/**
 * Хук для управления соединением с Transmission, инициализации и состояния переподключения.
 */
export function useConnectionManager() {
  const { t } = useLocalization();
  const { showSuccess, showError, showInfo } = useNotification(); // Получаем функции уведомлений
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Начальная загрузка конфига и первая попытка подключения
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null);

  // Функция для инициализации или переподключения с заданным конфигом
  const connect = useCallback(
    async (configToUse: AppConfig) => {
      setError(null);
      setIsReconnecting(false); // Сбрасываем флаг переподключения перед попыткой
      try {
        await Initialize(JSON.stringify(configToUse));
        setIsInitialized(true);
        // Показываем уведомление об успешном подключении
        showSuccess(
          t("notifications.connectionSuccessTitle"),
          t("notifications.connectionSuccessMessage", {
            host: configToUse.host,
          })
        );
        return true; // Успешное подключение
      } catch (initError) {
        console.error("Connection failed:", initError);
        const errorMessage = t("errors.connectionFailed"); // Общая ошибка подключения
        setError(errorMessage);
        // Показываем уведомление об ошибке подключения
        showError(t("notifications.connectionErrorTitle"), errorMessage);
        setIsInitialized(false);
        setIsReconnecting(true); // Устанавливаем флаг переподключения при ошибке
        return false; // Ошибка подключения
      }
    },
    [t, showSuccess, showError] // Добавляем зависимости
  );

  // Функция для попытки переподключения с последним известным конфигом
  const reconnect = useCallback(async () => {
    if (!initialConfig) {
      console.error("Cannot reconnect without initial config.");
      const errorMsg = t("errors.noConfigForReconnect");
      setError(errorMsg);
      showError(t("notifications.connectionErrorTitle"), errorMsg); // Уведомление об ошибке
      return false;
    }
    setIsReconnecting(true); // Явно устанавливаем флаг перед попыткой
    // Показываем информационное уведомление о попытке переподключения
    showInfo(
      t("notifications.reconnectingTitle"),
      t("notifications.reconnectingMessage", { host: initialConfig.host })
    );
    console.log("Attempting to reconnect...");
    return await connect(initialConfig);
  }, [initialConfig, connect, t, showInfo, showError]); // Добавляем зависимости

  // Первоначальная загрузка конфигурации и попытка подключения
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setError(null);
      setIsReconnecting(false);
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig) {
          // Нормализуем конфиг при загрузке
          const config: AppConfig = {
            ...savedConfig,
            theme: (savedConfig.theme || "light") as "light" | "dark" | "auto",
            slowSpeedUnit: (savedConfig.slowSpeedUnit || "KiB/s") as
              | "KiB/s"
              | "MiB/s",
            language: savedConfig.language || "en", // Добавляем язык по умолчанию
          };
          setInitialConfig(config); // Сохраняем для возможных переподключений
          // Попытка подключения вызовет уведомление внутри connect()
          await connect(config);
        } else {
          // Конфигурации нет - это нормальное состояние при первом запуске
          console.log("No configuration found. Waiting for settings.");
          setIsInitialized(false); // Не инициализировано, ждем настроек
        }
      } catch (error) {
        console.error("Failed to load initial config:", error);
        const errorMsg = t("errors.failedToLoadConfig");
        setError(errorMsg);
        showError(t("notifications.configErrorTitle"), errorMsg); // Уведомление об ошибке загрузки конфига
        setIsInitialized(false);
      } finally {
        setIsLoading(false); // Завершаем начальную загрузку в любом случае
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, showError]); // Добавляем showError в зависимости useEffect

  return {
    isInitialized,
    isLoading: isLoading, // Флаг начальной загрузки/попытки подключения
    isReconnecting,
    error, // Ошибка соединения или загрузки конфига
    initialConfig, // Возвращаем загруженный конфиг
    connect, // Функция для подключения с новым конфигом (из настроек)
    reconnect, // Функция для попытки переподключения
    setConnectionError: setError, // Позволяем другим хукам устанавливать ошибку соединения
    setIsReconnectingState: setIsReconnecting, // Позволяем другим хукам управлять состоянием реконнекта (например, при таймауте)
  };
}
