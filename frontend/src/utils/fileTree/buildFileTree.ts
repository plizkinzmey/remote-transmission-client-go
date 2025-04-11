import { FileNode, TorrentFile } from "../../types/FileTree";
import { addNodeToParent } from "./addNodeToParent";
import { calculateDirStats } from "./calculateDirStats";
import { createNodeForPath } from "./createNodeForPath";

/**
 * Строит дерево файлов из массива файлов торрента
 *
 * @param files - Массив файлов торрента
 * @returns Массив корневых узлов дерева
 */
export const buildFileTree = (files: TorrentFile[]): FileNode[] => {
  const root: { [path: string]: FileNode } = {};

  // Сначала сортируем файлы для более логичного отображения
  const sortedFiles = [...files].sort((a, b) => a.Path.localeCompare(b.Path));

  // Создаем узлы дерева для всех файлов и директорий
  sortedFiles.forEach((file) => {
    const pathParts = file.Path.split("/");
    let fullPath = "";

    // Создаем цепочку директорий для каждого файла
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLastPart = i === pathParts.length - 1;

      fullPath = fullPath ? `${fullPath}/${part}` : part;

      if (!root[fullPath]) {
        // Создаем узел для директории или файла
        const node = createNodeForPath(file, part, fullPath, isLastPart);
        root[fullPath] = node;

        // Добавляем узел к родительскому узлу, если это не корневой узел
        if (i > 0) {
          const parentPath = pathParts.slice(0, i).join("/");
          addNodeToParent(root, node, parentPath);
        }
      } else if (isLastPart) {
        // Если узел уже существует, но это конечный файл, обновляем его свойства
        const node = root[fullPath];
        node.ID = file.ID;
        node.Size = file.Size;
        node.Progress = file.Progress;
        node.Wanted = file.Wanted;
        node.isDirectory = false;
        node.children = undefined;
      }
    }
  });

  // Получаем только корневые узлы
  const rootNodes = Object.values(root).filter((node) => {
    const parentPath = node.Path.split("/").slice(0, -1).join("/");
    return parentPath === "" || !root[parentPath];
  });

  // Вычисляем статистику для всех директорий
  rootNodes.forEach(calculateDirStats);

  return rootNodes;
};
