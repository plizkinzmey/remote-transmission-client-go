/**
 * Интерфейс для торрент-файла, получаемого от API
 */
export interface TorrentFile {
  ID: number;
  Name: string;
  Path: string;
  Size: number;
  Progress: number;
  Wanted: boolean;
}

/**
 * Интерфейс для узла дерева файлов
 */
export interface FileNode {
  /** Уникальный идентификатор файла */
  ID: number;
  /** Имя файла или директории */
  Name: string;
  /** Полный путь к файлу */
  Path: string;
  /** Размер файла в байтах */
  Size: number;
  /** Прогресс загрузки файла в процентах (0-100) */
  Progress: number;
  /** Флаг, указывающий выбран ли файл для загрузки */
  Wanted: boolean;
  /** Флаг, указывающий является ли узел директорией */
  isDirectory?: boolean;
  /** Дочерние узлы (для директорий) */
  children?: FileNode[];
  /** Ссылка на родительский узел */
  parent?: FileNode;
  /** Флаг, указывающий развернут ли узел */
  expanded?: boolean;
  /** Флаг промежуточного состояния чекбокса (некоторые, но не все файлы выбраны) */
  indeterminate?: boolean;
}

/**
 * Результат вычисления статистики для директории
 */
export interface DirStats {
  /** Общий размер всех файлов в директории */
  size: number;
  /** Сумма прогресса загрузки всех файлов */
  progressSum: number;
  /** Количество файлов в директории */
  count: number;
  /** Флаг, указывающий что все файлы в директории выбраны */
  allWanted: boolean;
  /** Флаг, указывающий что хотя бы один файл в директории выбран */
  anyWanted: boolean;
}
