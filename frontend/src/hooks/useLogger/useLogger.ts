import {
  LogDebug,
  LogError,
  LogInfo,
  LogWarning,
} from "@wailsjs/runtime/runtime";

/**
 * Interface for the logger object returned by useLogger.
 */
export interface Logger {
  /**
   * Logs a debug message.
   * @param message - The message to log.
   * @param data - Optional data object to include in the log.
   */
  debug: (message: string, data?: object) => void;
  /**
   * Logs an info message.
   * @param message - The message to log.
   * @param data - Optional data object to include in the log.
   */
  info: (message: string, data?: object) => void;
  /**
   * Logs a warning message.
   * @param message - The message to log.
   * @param data - Optional data object to include in the log.
   */
  warn: (message: string, data?: object) => void;
  /**
   * Logs an error message.
   * @param message - The message to log.
   * @param data - Optional data object to include in the log.
   */
  error: (message: string, data?: object) => void;
}

/**
 * Custom hook for component-specific logging.
 *
 * Provides a logger instance with context automatically prepended to messages.
 *
 * @param context - The logging context (e.g., component name).
 * @returns A Logger object with debug, info, warn, and error methods.
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
