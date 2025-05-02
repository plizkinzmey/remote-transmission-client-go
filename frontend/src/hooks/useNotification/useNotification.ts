import { useCallback, useRef } from "react";
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
   * @param titleKey Ключ заголовка уведомления в файле локализации
   * @param messageKey Ключ сообщения уведомления в файле локализации
   * @param formatValues Опциональный объект со значениями для подстановки в сообщение
   */
  showSuccess: (
    titleKey: string,
    messageKey: string,
    formatValues?: Record<string, string | number>
  ) => void;

  /**
   * Показывает уведомление об ошибке (красное)
   * @param titleKey Ключ заголовка уведомления в файле локализации
   * @param messageKey Ключ сообщения уведомления в файле локализации
   * @param formatValues Опциональный объект со значениями для подстановки в сообщение
   */
  showError: (
    titleKey: string,
    messageKey: string,
    formatValues?: Record<string, string | number>
  ) => void;

  /**
   * Показывает информационное уведомление (синее)
   * @param titleKey Ключ заголовка уведомления в файле локализации
   * @param messageKey Ключ сообщения уведомления в файле локализации
   * @param formatValues Опциональный объект со значениями для подстановки в сообщение
   */
  showInfo: (
    titleKey: string,
    messageKey: string,
    formatValues?: Record<string, string | number>
  ) => void;

  /**
   * Показывает предупреждающее уведомление (оранжевое)
   * @param titleKey Ключ заголовка уведомления в файле локализации
   * @param messageKey Ключ сообщения уведомления в файле локализации
   * @param formatValues Опциональный объект со значениями для подстановки в сообщение
   */
  showWarning: (
    titleKey: string,
    messageKey: string,
    formatValues?: Record<string, string | number>
  ) => void;

  /**
   * Показывает уведомление с локализованным сообщением и возможностью подстановки значений
   * @param titleKey Ключ заголовка в файле локализации
   * @param messageKey Ключ сообщения в файле локализации
   * @param formatValues Объект со значениями для подстановки в сообщение
   * @param level Уровень важности уведомления
   */
  showFormatted: (
    titleKey: string,
    messageKey: string,
    formatValues: Record<string, string | number>,
    level: NotificationLevel
  ) => void;

  /**
   * Показывает уведомление с прямыми строками (без локализации)
   * Этот метод следует использовать только в исключительных случаях,
   * когда строки уже локализованы или не требуют локализации
   * @param title Заголовок уведомления
   * @param message Сообщение уведомления
   * @param level Уровень важности уведомления
   */
  showDirect: (
    title: string,
    message: string,
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
 * showSuccess("notifications.successTitle", "notifications.operationSuccess", { name: "file.txt" });
 *
 * // Показать уведомление об ошибке
 * showError("notifications.errorTitle", "notifications.operationFailed");
 */
export function useNotification(): UseNotificationResult {
  const { t } = useLocalization();

  // Добавляем механизм дедупликации
  const notificationCache = useRef<{ [key: string]: number }>({});

  /**
   * Базовая функция для отправки уведомления
   */
  const showNotification = useCallback(
    async (title: string, message: string, level: NotificationLevel) => {
      // Создаем уникальный ключ для этого уведомления
      const key = `${title}:${message}:${level}`;
      const now = Date.now();

      // Проверяем, было ли такое уведомление недавно (в течение 5 секунд)
      if (
        notificationCache.current[key] &&
        now - notificationCache.current[key] < 5000
      ) {
        console.log("Preventing duplicate notification:", title);
        return;
      }

      // Запоминаем время отправки этого уведомления
      notificationCache.current[key] = now;

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
   * Локализует строку с возможностью форматирования
   */
  const localize = useCallback(
    (key: string, formatValues?: Record<string, string | number>) => {
      if (!formatValues) {
        return t(key);
      }
      return t(key, formatValues as Record<string, string>);
    },
    [t]
  );

  /**
   * Показывает успешное уведомление (зеленое)
   */
  const showSuccess = useCallback(
    (
      titleKey: string,
      messageKey: string,
      formatValues?: Record<string, string | number>
    ) => {
      const localizedTitle = localize(titleKey, formatValues);
      const localizedMessage = localize(messageKey, formatValues);
      showNotification(localizedTitle, localizedMessage, "success");
    },
    [showNotification, localize]
  );

  /**
   * Показывает уведомление об ошибке (красное)
   */
  const showError = useCallback(
    (
      titleKey: string,
      messageKey: string,
      formatValues?: Record<string, string | number>
    ) => {
      const localizedTitle = localize(titleKey, formatValues);
      const localizedMessage = localize(messageKey, formatValues);
      showNotification(localizedTitle, localizedMessage, "error");
    },
    [showNotification, localize]
  );

  /**
   * Показывает информационное уведомление (синее)
   */
  const showInfo = useCallback(
    (
      titleKey: string,
      messageKey: string,
      formatValues?: Record<string, string | number>
    ) => {
      const localizedTitle = localize(titleKey, formatValues);
      const localizedMessage = localize(messageKey, formatValues);
      showNotification(localizedTitle, localizedMessage, "info");
    },
    [showNotification, localize]
  );

  /**
   * Показывает предупреждающее уведомление (оранжевое)
   */
  const showWarning = useCallback(
    (
      titleKey: string,
      messageKey: string,
      formatValues?: Record<string, string | number>
    ) => {
      const localizedTitle = localize(titleKey, formatValues);
      const localizedMessage = localize(messageKey, formatValues);
      showNotification(localizedTitle, localizedMessage, "warning");
    },
    [showNotification, localize]
  );

  /**
   * Показывает уведомление с локализованным сообщением и возможностью подстановки значений
   * (Оставлено для обратной совместимости)
   */
  const showFormatted = useCallback(
    (
      titleKey: string,
      messageKey: string,
      formatValues: Record<string, string | number>,
      level: NotificationLevel
    ) => {
      const localizedTitle = localize(titleKey, formatValues);
      const localizedMessage = localize(messageKey, formatValues);
      showNotification(localizedTitle, localizedMessage, level);
    },
    [localize, showNotification]
  );

  /**
   * Показывает уведомление с прямыми строками (без локализации)
   */
  const showDirect = useCallback(
    (title: string, message: string, level: NotificationLevel) => {
      showNotification(title, message, level);
    },
    [showNotification]
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showFormatted,
    showDirect,
  };
}
