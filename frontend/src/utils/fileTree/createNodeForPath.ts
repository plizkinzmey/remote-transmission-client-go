import { FileNode, TorrentFile } from "../../types/FileTree";

/**
 * Создает узел дерева файлов на основе данных файла торрента
 *
 * @param file - Данные файла торрента
 * @param partName - Имя части пути (директории или файла)
 * @param fullPath - Полный путь к узлу
 * @param isFile - Флаг, указывающий является ли узел файлом
 * @returns Созданный узел дерева
 */
export const createNodeForPath = (
  file: TorrentFile,
  partName: string,
  fullPath: string,
  isFile: boolean
): FileNode => {
  return {
    ID: isFile ? file.ID : -1,
    Name: partName,
    Path: fullPath,
    Size: isFile ? file.Size : 0,
    Progress: isFile ? file.Progress : 0,
    Wanted: isFile ? file.Wanted : false, // Изменяем на false для каталогов
    isDirectory: !isFile,
    children: !isFile ? [] : undefined,
    expanded: false, // Меняем на false, чтобы каталоги были свернуты
  };
};
