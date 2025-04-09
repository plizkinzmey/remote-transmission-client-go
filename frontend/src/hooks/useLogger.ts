import { LogDebug, LogError, LogInfo, LogWarning } from "../../wailsjs/runtime/runtime";

interface Logger {
  debug: (message: string, data?: object) => void;
  info: (message: string, data?: object) => void;
  warn: (message: string, data?: object) => void;
  error: (message: string, data?: object) => void;
}

/**
 * Хук для логирования с контекстом компонента
 * @param context - Контекст логирования (обычно имя компонента)
 * @returns Объект с методами логирования
 */
export const useLogger = (context: string): Logger => {
  const formatMessage = (message: string, data?: object): string => {
    const formattedMessage = `[${context}] ${message}`;
    if (data) {
      return `${formattedMessage} ${JSON.stringify(data)}`;
    }
    return formattedMessage;
  };

  return {
    debug: (message: string, data?: object) => {
      LogDebug(formatMessage(message, data));
    },
    info: (message: string, data?: object) => {
      LogInfo(formatMessage(message, data));
    },
    warn: (message: string, data?: object) => {
      LogWarning(formatMessage(message, data));
    },
    error: (message: string, data?: object) => {
      LogError(formatMessage(message, data));
    },
  };
};