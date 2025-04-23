// Данные торрента (из TorrentList)
export interface TorrentData {
  ID: number;
  Name: string;
  SizeWhenDone: number;
  LeftUntilDone: number;
  Eta: number;
  UploadRatio: number;
  RateDownload: number;
  RateUpload: number;
  Status: number;
  Error: number;
  ErrorString: string;
  IsFinished: boolean;
  IsStalled: boolean;
  IsPrivate: boolean;
  PercentDone: number;
  PeersConnected: number;
  PeersGettingFromUs: number;
  PeersSendingToUs: number;
  DownloadDir: string;
  AddedDate: number;
  DoneDate: number;
  StartDate: number;
  IsSeeding: boolean;
  IsDownloading: boolean;
  IsChecking: boolean;
  IsQueued: boolean;
  IsPaused: boolean;
  IsSlowMode: boolean;
}

// Статистика сессии
export interface SessionStatsData {
  TotalDownloadSpeed: number;
  TotalUploadSpeed: number;
  FreeSpace: number;
  TransmissionVersion: string;
}

// Определяем AppConfig напрямую, комбинируя необходимые части
// Импортируем базовые типы, если они нужны
import { ConnectionConfig, UIConfig } from "@/App";
// Импортируем тип торрента из Wails, используя правильный namespace
import { domain } from "@wailsjs/go/models";
export type WailsTorrent = domain.Torrent; // Экспортируем для использования в других хуках

export interface AppConfig extends ConnectionConfig, UIConfig {
  // Можно добавить сюда поля, специфичные для AppConfig, если они есть
  // Например, если бы ConnectionConfig или UIConfig были неполными
}

// Утилита для таймаута
export const withTimeout = <T>(
  promise: Promise<T>,
  timeout: number,
  t: (key: string) => string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(t("errors.timeout"))), timeout)
    ),
  ]);
};
