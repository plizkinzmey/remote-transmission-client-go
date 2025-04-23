import { useState, useEffect, useCallback } from "react";
import { Initialize, LoadConfig } from "@wailsjs/go/main/App";
import { AppConfig } from "./types";
import { useLocalization } from "@/contexts/LocalizationContext";

/**
 * Хук для управления соединением с Transmission, инициализации и состояния переподключения.
 */
export function useConnectionManager() {
  const { t } = useLocalization();
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
        return true; // Успешное подключение
      } catch (initError) {
        console.error("Connection failed:", initError);
        setError(t("errors.connectionFailed")); // Общая ошибка подключения
        setIsInitialized(false);
        setIsReconnecting(true); // Устанавливаем флаг переподключения при ошибке
        return false; // Ошибка подключения
      }
    },
    [t]
  );

  // Функция для попытки переподключения с последним известным конфигом
  const reconnect = useCallback(async () => {
    if (!initialConfig) {
      console.error("Cannot reconnect without initial config.");
      setError(t("errors.noConfigForReconnect"));
      return false;
    }
    setIsReconnecting(true); // Явно устанавливаем флаг перед попыткой
    console.log("Attempting to reconnect...");
    return await connect(initialConfig);
  }, [initialConfig, connect, t]);

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
          };
          setInitialConfig(config); // Сохраняем для возможных переподключений
          await connect(config); // Пытаемся подключиться
        } else {
          // Конфигурации нет - это нормальное состояние при первом запуске
          console.log("No configuration found. Waiting for settings.");
          setIsInitialized(false); // Не инициализировано, ждем настроек
        }
      } catch (error) {
        console.error("Failed to load initial config:", error);
        setError(t("errors.failedToLoadConfig"));
        setIsInitialized(false);
      } finally {
        setIsLoading(false); // Завершаем начальную загрузку в любом случае
      }
    };

    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]); // Зависимость connect не нужна, т.к. она используется внутри initializeApp

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
