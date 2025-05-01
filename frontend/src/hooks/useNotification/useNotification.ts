import { useCallback } from "react";
import { ShowNotification as GoShowNotification } from "@wailsjs/go/main/App";
import { LogError } from "@wailsjs/runtime";
import { useLocalization } from "@/contexts/LocalizationContext";

/**
 * Уровень важности уведомления, влияет на оформление и иконку уведомления.
 * - success: зеленый, для успешных операций
 * - error: красный, для критических ошибок
 * - info: синий, для информационных сообщений
 * - warning: оранжевый, для предупреждающих сообщений
 */
export type NotificationLevel = "info" | "success" | "warning" | "error";

/**
 * Результат, возвращаемый хуком useNotification
 */
export interface UseNotificationResult {
  /**
   * Показывает успешное уведомление (зеленое)
   * @param title Заголовок уведомления
   * @param message Сообщение уведомления
   */
  showSuccess: (title: string, message: string) => void;

  /**
   * Показывает уведомление об ошибке (красное)
   * @param title Заголовок уведомления
   * @param message Сообщение уведомления
   */
  showError: (title: string, message: string) => void;

  /**
   * Показывает информационное уведомление (синее)
   * @param title Заголовок уведомления
   * @param message Сообщение уведомления
   */
  showInfo: (title: string, message: string) => void;

  /**
   * Показывает предупреждающее уведомление (оранжевое)
   * @param title Заголовок уведомления
   * @param message Сообщение уведомления
   */
  showWarning: (title: string, message: string) => void;

  /**
   * Показывает уведомление с локализованным сообщением и возможностью подстановки значений
   * @param title Заголовок уведомления
   * @param messageKey Ключ сообщения в файле локализации
   * @param formatValues Объект со значениями для подстановки в сообщение
   * @param level Уровень важности уведомления
   */
  showFormatted: (
    title: string,
    messageKey: string,
    formatValues: Record<string, string | number>,
    level: NotificationLevel
  ) => void;
}

/**
 * Хук для отображения нативных системных уведомлений
 * @returns Набор функций для отображения уведомлений разных типов
 *
 * @example
 * const { showSuccess, showError } = useNotification();
 *
 * // Показать успешное уведомление
 * showSuccess("Успех", "Операция выполнена успешно");
 *
 * // Показать уведомление об ошибке
 * showError("Ошибка", "Не удалось выполнить операцию");
 */
export function useNotification(): UseNotificationResult {
  const { t } = useLocalization();

  /**
   * Базовая функция для отправки уведомления
   */
  const showNotification = useCallback(
    async (title: string, message: string, level: NotificationLevel) => {
      try {
        await GoShowNotification(title, message, level);
      } catch (error) {
        // Логируем ошибку через Wails Runtime
        LogError(`Failed to show notification: ${error}`);
        // Дополнительно выводим в консоль для разработчика
        console.error(`[Notification Error] ${title}: ${message}`, error);
      }
    },
    []
  );

  /**
   * Показывает успешное уведомление (зеленое)
   */
  const showSuccess = useCallback(
    (title: string, message: string) => {
      showNotification(title, message, "success");
    },
    [showNotification]
  );

  /**
   * Показывает уведомление об ошибке (красное)
   */
  const showError = useCallback(
    (title: string, message: string) => {
      showNotification(title, message, "error");
    },
    [showNotification]
  );

  /**
   * Показывает информационное уведомление (синее)
   */
  const showInfo = useCallback(
    (title: string, message: string) => {
      showNotification(title, message, "info");
    },
    [showNotification]
  );

  /**
   * Показывает предупреждающее уведомление (оранжевое)
   */
  const showWarning = useCallback(
    (title: string, message: string) => {
      showNotification(title, message, "warning");
    },
    [showNotification]
  );

  /**
   * Показывает уведомление с локализованным сообщением и возможностью подстановки значений
   */
  const showFormatted = useCallback(
    (
      title: string,
      messageKey: string,
      formatValues: Record<string, string | number>,
      level: NotificationLevel
    ) => {
      const localizedMessage = t(
        messageKey,
        formatValues as Record<string, string>
      );
      showNotification(title, localizedMessage, level);
    },
    [t, showNotification]
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showFormatted,
  };
}
