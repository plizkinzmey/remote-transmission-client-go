import { useState, useEffect, useCallback, useRef } from "react";
import { Initialize, LoadConfig } from "@wailsjs/go/main/App";
import { AppConfig } from "./types";
import { useLocalization } from "@/contexts/LocalizationContext";
import { useNotification } from "@/hooks/useNotification";

/**
 * Хук для управления соединением с Transmission, инициализации и состояния переподключения.
 */
export function useConnectionManager() {
  const { t } = useLocalization();
  const { showSuccess, showError, showInfo } = useNotification();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialConfig, setInitialConfig] = useState<AppConfig | null>(null);

  // Добавляем флаг для отслеживания, был ли уже запущен процесс инициализации
  const isInitializationStartedRef = useRef(false);

  // Функция для инициализации или переподключения с заданным конфигом
  const connect = useCallback(
    async (configToUse: AppConfig) => {
      setError(null);
      setIsReconnecting(false); // Сбрасываем флаг переподключения перед попыткой
      try {
        console.log("[ConnectionManager] Starting Initialize...");
        await Initialize(JSON.stringify(configToUse));
        console.log("[ConnectionManager] Initialize successful");
        setIsInitialized(true);
        // Показываем уведомление об успешном подключении с использованием нового API
        showSuccess(
          "notifications.connectionSuccessTitle",
          "notifications.connectionSuccessMessage",
          { host: configToUse.host }
        );
        return true; // Успешное подключение
      } catch (initError) {
        console.error("Connection failed:", initError);
        const errorMessage = t("errors.connectionFailed"); // Общая ошибка подключения
        setError(errorMessage);
        // Показываем уведомление об ошибке подключения с использованием нового API
        showError(
          "notifications.connectionErrorTitle",
          "errors.connectionFailed"
        );
        setIsInitialized(false);
        setIsReconnecting(true); // Устанавливаем флаг переподключения при ошибке
        return false; // Ошибка подключения
      }
    },
    [t, showSuccess, showError]
  );

  // Функция для попытки переподключения с последним известным конфигом
  const reconnect = useCallback(async () => {
    if (!initialConfig) {
      console.error("Cannot reconnect without initial config.");
      const errorMsg = t("errors.noConfigForReconnect");
      setError(errorMsg);
      // Используем ключ локализации вместо t() для уведомления
      showError(
        "notifications.connectionErrorTitle",
        "errors.noConfigForReconnect"
      );
      return false;
    }
    setIsReconnecting(true); // Явно устанавливаем флаг перед попыткой
    // Показываем информационное уведомление о попытке переподключения
    showInfo(
      "notifications.reconnectingTitle",
      "notifications.reconnectingMessage",
      { host: initialConfig.host }
    );
    console.log("Attempting to reconnect...");
    return await connect(initialConfig);
  }, [initialConfig, connect, t, showInfo, showError]);

  // Первоначальная загрузка конфигурации и попытка подключения
  useEffect(() => {
    const initializeApp = async () => {
      // Проверяем, не был ли уже запущен процесс инициализации
      if (isInitializationStartedRef.current) {
        console.log(
          "[ConnectionManager] Initialization already started, skipping"
        );
        return;
      }

      // Устанавливаем флаг, что инициализация началась
      isInitializationStartedRef.current = true;

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
        // Используем ключ локализации вместо t() для уведомления
        showError(
          "notifications.configErrorTitle",
          "errors.failedToLoadConfig"
        );
        setIsInitialized(false);
      } finally {
        setIsLoading(false); // Завершаем начальную загрузку в любом случае
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, showError, connect]); // Явно добавляем connect в зависимости

  return {
    isInitialized,
    isLoading: isLoading,
    isReconnecting,
    error,
    initialConfig,
    connect,
    reconnect,
    setConnectionError: setError,
    setIsReconnectingState: setIsReconnecting,
  };
}
