import { FileNode } from "../../types/FileTree";

/**
 * Добавляет узел к родительскому узлу в дереве файлов
 *
 * @param root - Объект с узлами дерева, где ключи - пути к узлам
 * @param node - Узел, который нужно добавить
 * @param parentPath - Путь к родительскому узлу
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
