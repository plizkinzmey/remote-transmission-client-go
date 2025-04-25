import { FileNode } from "../../types/FileTree";
import { calculateDirStats } from "./calculateDirStats";

/**
 * Рекурсивно обновляет свойство `Wanted` для целевого узла и всех его дочерних узлов (если это директория),
 * а также для узлов, чьи ID файлов присутствуют в списке `fileIds`.
 * Возвращает новый массив узлов с обновленными значениями, не мутируя исходный массив.
 *
 * @param {FileNode[]} nodes - Массив узлов дерева для обновления.
 * @param {FileNode} targetNode - Узел, для которого (и/или его дочерних элементов) нужно изменить состояние `Wanted`.
 * @param {boolean} wanted - Новое значение для свойства `Wanted`.
 * @param {number[]} fileIds - Массив ID файлов, которые также должны быть обновлены (обычно это файлы, принадлежащие `targetNode`, если это директория).
 * @returns {FileNode[]} Новый массив узлов с обновленным состоянием `Wanted`.
 */
export const updateNodesWanted = (
  nodes: FileNode[],
  targetNode: FileNode,
  wanted: boolean,
  fileIds: number[]
): FileNode[] => {
  return nodes.map((node) => {
    const newNode = { ...node };

    // Условия для обновления:
    // 1. Это сам целевой узел.
    // 2. Это директория, и ее путь начинается с пути целевой директории (т.е. вложенная директория).
    // 3. ID файла узла присутствует в списке fileIds.
    if (
      node === targetNode ||
      (node.isDirectory &&
        targetNode.isDirectory &&
        node.Path.startsWith(targetNode.Path + "/")) || // Уточняем проверку пути для вложенности
      (!node.isDirectory && fileIds.includes(node.ID)) // Обновляем только файлы по ID
    ) {
      newNode.Wanted = wanted;
      // Сбрасываем indeterminate, так как состояние Wanted стало определенным
      newNode.indeterminate = false;
    }

    // Рекурсивно обновляем дочерние узлы, если они есть
    if (node.children) {
      newNode.children = updateNodesWanted(
        node.children,
        targetNode,
        wanted,
        fileIds
      );

      // Пересчитываем статистику для родительской директории после обновления дочерних
      // Это необходимо для обновления indeterminate и Wanted самой директории
      if (newNode.isDirectory) {
        const stats = newNode.children.map(calculateDirStats); // Используем calculateDirStats для пересчета
        const allWanted = stats.every((s) => s.allWanted);
        const anyWanted = stats.some((s) => s.anyWanted);
        newNode.Wanted = allWanted;
        newNode.indeterminate = anyWanted && !allWanted;
      }
    }
    return newNode;
  });
};
