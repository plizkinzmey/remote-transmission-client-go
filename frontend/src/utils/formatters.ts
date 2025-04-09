/**
 * Форматирует размер файла в читаемый вид с учётом единиц измерения
 * @param size Размер в байтах
 * @returns Отформатированная строка
 */
export const formatFileSize = (size: number | undefined): string => {
  // Проверка на undefined или отрицательные значения
  if (size === undefined || size < 0) {
    return "0.00 B";
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Форматирует скорость загрузки/отдачи в читаемый вид
 * @param speed Скорость в байтах в секунду
 * @returns Отформатированная строка
 */
export const formatSpeed = (speed: number | undefined): string => {
  if (speed === undefined || speed < 0) {
    return "0.00 KiB/s";
  }

  if (speed === 0) {
    return "0.00 KiB/s";
  }

  const units = ["B/s", "KiB/s", "MiB/s", "GiB/s"];
  let value = speed;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Нормализует значение, заменяя отрицательные на ноль
 * @param value Значение для нормализации
 * @returns Нормализованное значение
 */
export const normalizeValue = (value: number): number => {
  return value < 0 ? 0 : value;
};

/**
 * Форматирует коэффициент отдачи
 * @param ratio Коэффициент отдачи
 * @returns Отформатированная строка
 */
export const formatRatio = (ratio: number): string => {
  return normalizeValue(ratio).toFixed(2);
};

/**
 * Форматирует скорость в удобочитаемый вид с единицами измерения
 * @param speed - Скорость в байтах в секунду
 * @returns Отформатированная строка со скоростью (например, "1.24 MB/s")
 */
export const formatTransferSpeed = (speed?: number): string => {
  const numericSpeed = Number(speed);
  if (speed === undefined || Number.isNaN(numericSpeed) || numericSpeed < 0)
    return "0.00 B/s";

  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let value = numericSpeed;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Форматирует размер в удобочитаемый вид с единицами измерения
 * @param size - Размер в байтах
 * @returns Отформатированная строка с размером (например, "1.24 GB")
 */
export const formatStorageSize = (size?: number): string => {
  const numericSize = Number(size);
  if (size === undefined || Number.isNaN(numericSize) || numericSize < 0)
    return "0.00 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = numericSize;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};
