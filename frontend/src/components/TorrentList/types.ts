/**
 * Интерфейс данных торрента
 */
export interface TorrentData {
  /** Уникальный идентификатор торрента */
  ID: number;
  /** Название торрента */
  Name: string;
  /** Статус торрента */
  Status: string;
  /** Прогресс загрузки в процентах */
  Progress: number;
  /** Размер в байтах */
  Size: number;
  /** Отформатированный размер */
  SizeFormatted: string;
  /** Рейтинг отдачи */
  UploadRatio: number;
  /** Количество подключенных сидов */
  SeedsConnected: number;
  /** Общее количество сидов */
  SeedsTotal: number;
  /** Количество подключенных пиров */
  PeersConnected: number;
  /** Общее количество пиров */
  PeersTotal: number;
  /** Количество отданных байт */
  UploadedBytes: number;
  /** Отформатированное количество отданных данных */
  UploadedFormatted: string;
  /** Скорость загрузки в байтах/сек */
  DownloadSpeed: number;
  /** Скорость отдачи в байтах/сек */
  UploadSpeed: number;
  /** Отформатированная скорость загрузки */
  DownloadSpeedFormatted: string;
  /** Отформатированная скорость отдачи */
  UploadSpeedFormatted: string;
  /** Флаг медленного режима */
  IsSlowMode: boolean;
}

/**
 * Пропсы компонента TorrentList
 */
export interface TorrentListProps {
  /** Массив торрентов для отображения */
  torrents: TorrentData[];
  /** Строка поиска для фильтрации торрентов */
  searchTerm: string;
  /** Множество выбранных торрентов */
  selectedTorrents: Set<number>;
  /** Callback выбора торрента */
  onSelect: (id: number) => void;
  /** Callback удаления торрента */
  onRemove: (id: number, deleteData: boolean) => void;
  /** Callback запуска торрента */
  onStart: (id: number) => void;
  /** Callback остановки торрента */
  onStop: (id: number) => void;
  /** Callback проверки торрента */
  onVerify?: (id: number) => void;
  /** Флаг загрузки данных */
  isLoading?: boolean;
  /** Флаг переподключения */
  isReconnecting?: boolean;
  /** Callback установки ограничения скорости */
  onSetSpeedLimit?: (id: number, isSlowMode: boolean) => void;
}
