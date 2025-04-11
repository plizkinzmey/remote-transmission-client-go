import { FileNode } from "../../types/FileTree";

/**
 * Собирает ID всех файлов в узле и его дочерних узлах
 *
 * @param node - Узел для сбора ID файлов
 * @returns Массив ID файлов
 */
export const collectFileIds = (node: FileNode): number[] => {
  if (!node.isDirectory && node.ID >= 0) {
    return [node.ID];
  }
  if (node.children) {
    return node.children.flatMap(collectFileIds);
  }
  return [];
};
