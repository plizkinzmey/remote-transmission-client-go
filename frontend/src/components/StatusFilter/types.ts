import { ColorType, StatusType } from "../../utils/torrentStatus";

/**
 * Интерфейс для определения опции статуса фильтрации
 */
export interface StatusOption {
  /** Идентификатор статуса */
  id: StatusType | "slow";
  /** Метка для перевода */
  label: string;
  /** Цвет кнопки фильтра */
  color: ColorType | "orange";
  /** Дополнительные статусы для матчинга (опционально) */
  matchStatuses?: string[];
}

/**
 * Пропсы компонента StatusFilter
 */
export interface StatusFilterProps {
  /** Текущий выбранный статус фильтрации */
  selectedStatus: StatusType | "slow" | null;
  /** Callback для изменения статуса фильтрации */
  onStatusChange: (status: StatusType | "slow" | null) => void;
  /** Флаг отсутствия торрентов */
  hasNoTorrents: boolean;
  /** Флаг процесса переподключения */
  isReconnecting: boolean;
}
