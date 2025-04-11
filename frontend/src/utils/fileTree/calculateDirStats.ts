import { DirStats, FileNode } from "../../types/FileTree";

/**
 * Вычисляет статистику для директории на основе дочерних файлов и директорий
 * Обновляет свойства узла, включая Wanted и indeterminate
 *
 * @param node - Узел директории для вычисления статистики
 * @returns Объект со статистикой
 */
export const calculateDirStats = (node: FileNode): DirStats => {
  if (!node.isDirectory || !node.children?.length) {
    return {
      size: node.Size || 0,
      progressSum: node.Progress || 0,
      count: 1,
      allWanted: node.Wanted,
      anyWanted: node.Wanted,
    };
  }

  const stats = node.children.map(calculateDirStats);
  const totalSize = stats.reduce((sum, s) => sum + s.size, 0);
  const totalProgressSum = stats.reduce(
    (sum, s) => sum + s.progressSum * s.count,
    0
  );
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  const allWanted = stats.every((s) => s.allWanted);
  const anyWanted = stats.some((s) => s.anyWanted);

  node.Size = totalSize;
  node.Progress = totalCount > 0 ? totalProgressSum / totalCount : 0;
  node.Wanted = allWanted; // Устанавливаем Wanted для каталога на основе вложенных файлов
  node.indeterminate = anyWanted && !allWanted; // Устанавливаем промежуточное состояние

  return {
    size: totalSize,
    progressSum: node.Progress,
    count: totalCount,
    allWanted,
    anyWanted,
  };
};
