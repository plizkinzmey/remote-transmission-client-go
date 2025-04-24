// Типы статусов торрентов
export type StatusType =
  | "downloading"
  | "seeding"
  | "stopped"
  | "completed"
  | "checking"
  | "queuedCheck"
  | "queuedDownload"
  | "queued"
  | "error";

// Типы цветов для отображения статусов
export type ColorType =
  | "blue"
  | "grass"
  | "gray"
  | "amber"
  | "purple"
  | "mint"
  | "tomato";

/**
 * Определяет, находится ли торрент в активном состоянии
 * @param status Статус торрента
 */
export const isRunning = (status: string): boolean => {
  return ["downloading", "seeding"].includes(status);
};

/**
 * Определяет, находится ли торрент в состоянии проверки
 * @param status Статус торрента
 */
export const isChecking = (status: string): boolean => {
  return status === "checking";
};

/**
 * Определяет, находится ли торрент в очереди
 * @param status Статус торрента
 */
export const isQueued = (status: string): boolean => {
  return ["queuedCheck", "queuedDownload", "queued"].includes(status);
};

/**
 * Определяет, должен ли торрент быть заблокированным для действий
 * @param status Статус торрента
 */
export const isBlocked = (status: StatusType): boolean => {
  return isChecking(status) || isQueued(status) || status === "error"; // Добавлена проверка на 'error'
};

/**
 * Получает информацию о статусе торрента для отображения
 * @param status Статус торрента
 */
export const getStatusData = (status: StatusType): { color: ColorType } => {
  const statusMap: Record<StatusType, { color: ColorType }> = {
    downloading: { color: "blue" },
    seeding: { color: "grass" },
    completed: { color: "mint" },
    checking: { color: "amber" },
    queued: { color: "purple" },
    queuedCheck: { color: "purple" },
    queuedDownload: { color: "purple" },
    stopped: { color: "gray" },
    error: { color: "tomato" }, // Добавлена запись для 'error'
  };

  // Используем StatusType для ключа и возвращаем значение по умолчанию, если статус неизвестен
  // (хотя с StatusType это маловероятно, но безопасно)
  return statusMap[status] || { color: "gray" };
};

/**
 * Получает CSS класс для карточки торрента на основе его статуса
 * @param status Статус торрента
 * @param baseClass Ключ базового CSS класса в stylesModule
 * @param stylesModule Объект со стилями (CSS Modules)
 */
export const getCardClassName = (
  status: StatusType,
  baseClass: string,
  stylesModule: Record<string, string>
): string => {
  const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
  const statusClassKey = "card" + statusCapitalized;

  const baseClassName = stylesModule[baseClass];
  const statusClassName = stylesModule[statusClassKey];

  // Собираем классы, только если они существуют
  const classes = [];
  if (baseClassName) {
    classes.push(baseClassName);
  }
  if (statusClassName) {
    classes.push(statusClassName);
  }

  return classes.join(" "); // Объединяем через пробел
};

/**
 * Преобразует статус, полученный от бэкенда (строка, null или undefined),
 * в соответствующий StatusType для использования во фронтенде.
 * Возвращает 'error' для неизвестных, неопределенных или null статусов.
 *
 * @param backendStatus - Статус от бэкенда (например, "downloading", "stopped", null, undefined).
 * @returns Соответствующий StatusType или 'error' при невозможности маппинга.
 */
export const mapBackendStatusToFrontend = (
  backendStatus: string | undefined | null
): StatusType => {
  if (backendStatus === undefined || backendStatus === null) {
    return "error"; // Обработка null/undefined
  }

  // Проверяем, является ли полученный статус валидным StatusType
  const validStatuses: StatusType[] = [
    "downloading",
    "seeding",
    "stopped",
    "completed",
    "checking",
    "queuedCheck",
    "queuedDownload",
    "queued",
  ];

  if (validStatuses.includes(backendStatus as StatusType)) {
    return backendStatus as StatusType;
  }

  // Если статус не распознан, возвращаем 'error'
  return "error";
};
