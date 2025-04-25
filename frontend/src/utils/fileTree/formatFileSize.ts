/**
 * Форматирует числовое значение размера файла (в байтах) в человекочитаемую строку
 * с использованием бинарных префиксов (KiB, MiB, GiB, TiB).
 * Округляет результат до двух знаков после запятой.
 *
 * @param {number | undefined} size - Размер файла в байтах. Может быть `undefined`.
 * @returns {string} Отформатированная строка размера файла (например, "1.23 MiB", "500 B").
 *                   Возвращает "0.00 B" если `size` равен `undefined`, `null`, отрицательный или 0.
 */
export const formatFileSize = (size: number | undefined): string => {
  // Обработка некорректных или нулевых значений
  if (size === undefined || size <= 0) {
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
