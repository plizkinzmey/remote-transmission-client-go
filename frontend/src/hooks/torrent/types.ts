import { ConnectionConfig, UIConfig } from "@/App";
import { domain } from "@wailsjs/go/models";
import { StatusType } from "@utils/torrentStatus"; // Импортируем StatusType

// Экспортируем тип WailsTorrent из моделей Wails
export type WailsTorrent = domain.Torrent;

// Данные торрента (используется в тестах и компонентах)
export interface TorrentData {
  ID: number;
  Name: string;
  Status: StatusType; // <-- Изменяем тип на StatusType
  Progress: number;
  Size: number;
  SizeFormatted: string;
  UploadRatio: number;
  SeedsConnected: number;
  SeedsTotal: number;
  PeersConnected: number;
  PeersTotal: number;
  UploadedBytes: number;
  UploadedFormatted: string;
  DownloadSpeed: number;
  UploadSpeed: number;
  DownloadSpeedFormatted: string;
  UploadSpeedFormatted: string;
  IsSlowMode: boolean;
}

// Тип для статистики сессии
export interface SessionStatsData {
  TotalDownloadSpeed: number;
  TotalUploadSpeed: number;
  FreeSpace: number;
  TransmissionVersion: string;
}

// Конфигурация приложения
export interface AppConfig extends ConnectionConfig, UIConfig {
  // Объединяем ConnectionConfig и UIConfig
}

/**
 * Утилита для добавления таймаута к промисам
 * @param promise - Промис, к которому добавляется таймаут
 * @param timeout - Время таймаута в миллисекундах
 * @param t - Функция перевода для сообщений об ошибках
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeout: number,
  t: (key: string) => string
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(t("errors.timeout")));
    }, timeout);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};
