/**
 * Форматирует размер файла в читаемый вид (Байты, КБ, МБ, ГБ, ТБ)
 *
 * @param size - Размер файла в байтах
 * @returns Отформатированная строка с размером файла и единицей измерения
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
