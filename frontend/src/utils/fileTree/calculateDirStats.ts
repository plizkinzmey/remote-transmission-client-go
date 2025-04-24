import { DirStats, FileNode } from "../../types/FileTree";

/**
 * Рекурсивно вычисляет агрегированную статистику для узла директории на основе
 * статистики его дочерних узлов (файлов и поддиректорий).
 * Обновляет свойства `Size`, `Progress`, `Wanted` и `indeterminate` для переданного узла директории.
 *
 * @param {FileNode} node - Узел директории, для которого нужно вычислить статистику.
 *                          Ожидается, что узел является директорией (`isDirectory === true`).
 * @returns {DirStats} Объект, содержащий вычисленную статистику для данного узла и его поддерева:
 *                     `size` - общий размер,
 *                     `progressSum` - взвешенная сумма прогресса,
 *                     `count` - общее количество файлов,
 *                     `allWanted` - флаг, указывающий, выбраны ли все дочерние элементы,
 *                     `anyWanted` - флаг, указывающий, выбран ли хотя бы один дочерний элемент.
 */
export const calculateDirStats = (node: FileNode): DirStats => {
  if (!node.isDirectory || !node.children?.length) {
    // Базовый случай: узел является файлом или пустой директорией
    return {
      size: node.Size || 0,
      progressSum: node.Progress || 0,
      count: 1,
      allWanted: node.Wanted,
      anyWanted: node.Wanted,
    };
  }

  // Рекурсивный вызов для дочерних узлов
  const stats = node.children.map(calculateDirStats);
  const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
  const totalProgressSum = stats.reduce(
    (sum, s) => sum + s.progressSum * s.count,
    0
  );
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  const allWanted = stats.every((s) => s.allWanted);
  const anyWanted = stats.some((s) => s.anyWanted);

  // Обновление статистики текущего узла директории
  node.Size = totalSize;
  node.Progress = totalCount > 0 ? totalProgressSum / totalCount : 0;
  node.Wanted = allWanted; // Директория считается 'wanted', если все внутри 'wanted'
  node.indeterminate = anyWanted && !allWanted; // Промежуточное состояние, если выбраны не все, но хотя бы один

  return {
    size: totalSize,
    progressSum: node.Progress, // Возвращаем обновленный прогресс узла
    count: totalCount,
    allWanted,
    anyWanted,
  };
};
