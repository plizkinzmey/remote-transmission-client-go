/**
 * @deprecated Используйте `formatSize`.
 * Форматирует размер файла в читаемый вид с учётом единиц измерения (KiB).
 * @param size Размер в байтах
 * @returns Отформатированная строка
 */
export const formatFileSize = (size: number | undefined): string => {
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
 * @deprecated Используйте `formatSpeed`.
 * Форматирует скорость загрузки/отдачи в читаемый вид (KiB/s).
 * @param speed Скорость в байтах в секунду
 * @returns Отформатированная строка
 */
export const formatSpeed_deprecated = (speed: number | undefined): string => {
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
 * Нормализует числовое значение, заменяя отрицательные, NaN, undefined или null на ноль.
 * @param value Значение для нормализации.
 * @returns Нормализованное значение (не меньше нуля).
 */
export const normalizeValue = (value: number | undefined | null): number => {
  const numericValue = Number(value);
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(numericValue) ||
    numericValue < 0
  ) {
    return 0;
  }
  return numericValue;
};

/**
 * Форматирует коэффициент отдачи (ratio) до двух знаков после запятой.
 * Отрицательные значения приводятся к 0.00.
 * @param ratio Коэффициент отдачи.
 * @returns Отформатированная строка (например, "1.23").
 */
export const formatRatio = (ratio: number | undefined | null): string => {
  return normalizeValue(ratio).toFixed(2);
};

/**
 * @deprecated Используйте `formatSpeed`.
 * Форматирует скорость в удобочитаемый вид с единицами измерения (KB/s).
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
 * @deprecated Используйте `formatSize`.
 * Форматирует размер в удобочитаемый вид с единицами измерения (KB).
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

// --- Новые консолидированные функции --- //

const KILO_BASE = 1024;
const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
const SPEED_UNITS = ["B/s", "KB/s", "MB/s", "GB/s", "TB/s", "PB/s", "EB/s"];

/**
 * Форматирует размер данных (в байтах) в удобочитаемый вид с использованием стандартных
 * единиц измерения (B, KB, MB, GB, TB), основанных на 1024.
 *
 * @param size - Размер в байтах. Может быть числом, undefined или null.
 * @returns Отформатированная строка с размером (например, "1.24 GB") или "0.00 B" для некорректных входных данных.
 */
export const formatSize = (size: number | undefined | null): string => {
  const numericSize = normalizeValue(size);

  if (numericSize === 0) {
    return `0.00 ${SIZE_UNITS[0]}`;
  }

  let value = numericSize;
  let unitIndex = 0;

  while (value >= KILO_BASE && unitIndex < SIZE_UNITS.length - 1) {
    value /= KILO_BASE;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${SIZE_UNITS[unitIndex]}`;
};

/**
 * Форматирует скорость передачи данных (в байтах в секунду) в удобочитаемый вид
 * с использованием стандартных единиц измерения (B/s, KB/s, MB/s, GB/s, TB/s), основанных на 1024.
 *
 * @param speed - Скорость в байтах в секунду. Может быть числом, undefined или null.
 * @returns Отформатированная строка со скоростью (например, "1.24 MB/s") или "0.00 B/s" для некорректных входных данных.
 */
export const formatSpeed = (speed: number | undefined | null): string => {
  const numericSpeed = normalizeValue(speed);

  if (numericSpeed === 0) {
    return `0.00 ${SPEED_UNITS[0]}`;
  }

  let value = numericSpeed;
  let unitIndex = 0;

  while (value >= KILO_BASE && unitIndex < SPEED_UNITS.length - 1) {
    value /= KILO_BASE;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${SPEED_UNITS[unitIndex]}`;
};
