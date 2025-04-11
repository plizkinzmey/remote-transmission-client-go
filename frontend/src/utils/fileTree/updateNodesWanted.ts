import { FileNode } from "../../types/FileTree";

/**
 * Обновляет свойство Wanted у узла и соответствующих дочерних узлов
 *
 * @param nodes - Массив узлов для обновления
 * @param targetNode - Целевой узел, который был изменен
 * @param wanted - Новое значение свойства Wanted
 * @param fileIds - Массив ID файлов, которые нужно обновить
 * @returns Обновленный массив узлов
 */
export const updateNodesWanted = (
  nodes: FileNode[],
  targetNode: FileNode,
  wanted: boolean,
  fileIds: number[]
): FileNode[] => {
  return nodes.map((node) => {
    const newNode = { ...node };
    if (
      node === targetNode ||
      (node.isDirectory &&
        targetNode.isDirectory &&
        node.Path.startsWith(targetNode.Path)) ||
      fileIds.includes(node.ID)
    ) {
      newNode.Wanted = wanted;
    }
    if (node.children) {
      newNode.children = updateNodesWanted(
        node.children,
        targetNode,
        wanted,
        fileIds
      );
    }
    return newNode;
  });
};
