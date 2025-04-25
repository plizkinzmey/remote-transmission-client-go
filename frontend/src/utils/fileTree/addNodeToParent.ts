import { FileNode } from "../../types/FileTree";

/**
 * Добавляет дочерний узел к родительскому узлу в предоставленном объекте узлов дерева.
 * Модифицирует родительский узел напрямую.
 *
 * @param {{ [path: string]: FileNode }} root - Объект, содержащий все узлы дерева, индексированные по их путям.
 * @param {FileNode} node - Узел, который нужно добавить как дочерний.
 * @param {string} parentPath - Путь к родительскому узлу, к которому нужно добавить дочерний узел.
 * @returns {void} Ничего не возвращает, так как модифицирует `root` напрямую.
 */
export const addNodeToParent = (
  root: { [path: string]: FileNode },
  node: FileNode,
  parentPath: string
): void => {
  const parentNode = root[parentPath];
  if (parentNode?.children) {
    parentNode.children.push(node);
  }
};
