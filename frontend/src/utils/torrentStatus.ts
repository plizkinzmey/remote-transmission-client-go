// Типы статусов торрентов
export type StatusType =
  | "downloading"
  | "seeding"
  | "stopped"
  | "completed"
  | "checking"
  | "queuedCheck"
  | "queuedDownload"
  | "queued";

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
export const isBlocked = (status: string): boolean => {
  return isChecking(status) || isQueued(status);
};

/**
 * Получает информацию о статусе торрента для отображения
 * @param status Статус торрента
 */
export const getStatusData = (status: string): { color: ColorType } => {
  const statusMap: Record<string, { color: ColorType }> = {
    downloading: { color: "blue" },
    seeding: { color: "grass" },
    completed: { color: "mint" },
    checking: { color: "amber" },
    queued: { color: "purple" },
    queuedCheck: { color: "purple" },
    queuedDownload: { color: "purple" },
    stopped: { color: "gray" },
  };

  return statusMap[status] || { color: "gray" };
};

/**
 * Получает CSS класс для карточки торрента на основе его статуса
 * @param status Статус торрента
 * @param baseClass Базовый CSS класс
 * @param stylesModule Объект со стилями
 */
export const getCardClassName = (
  status: string,
  baseClass: string,
  stylesModule: Record<string, string>
): string => {
  const statusCapitalized = status.charAt(0).toUpperCase() + status.slice(1);
  const statusClassName = "card" + statusCapitalized;
  return `${stylesModule[baseClass]} ${stylesModule[statusClassName] || ""}`;
};
