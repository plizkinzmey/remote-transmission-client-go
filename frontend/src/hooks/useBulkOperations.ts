import { useState, useEffect, useCallback } from "react";
import { TorrentData } from "@/components/TorrentList"; // Исправлен путь импорта
import { useLocalization } from "@contexts/LocalizationContext";
import {
  StartTorrents,
  StopTorrents,
  RemoveTorrent,
  SetTorrentSpeedLimit,
} from "../../wailsjs/go/main/App";

/**
 * Состояние выполнения массовых операций.
 */
interface BulkOperationsState {
  /** Флаг, указывающий, выполняется ли операция запуска. */
  start: boolean;
  /** Флаг, указывающий, выполняется ли операция остановки. */
  stop: boolean;
  /** Флаг, указывающий, выполняется ли операция удаления. */
  remove: boolean;
  /** Флаг, указывающий, выполняется ли операция установки лимита скорости. */
  speedLimit: boolean;
}

/**
 * Конфигурация приложения, необходимая для хука.
 */
interface Config {
  /** Ограничение скорости для медленного режима. */
  slowSpeedLimit: number;
  /** Единица измерения для ограничения скорости. */
  slowSpeedUnit: "KiB/s" | "MiB/s";
}

/**
 * @typedef {object} UseBulkOperationsResult
 * @property {BulkOperationsState} bulkOperations - Состояние выполнения массовых операций.
 * @property {string | null} error - Сообщение об ошибке, если она произошла во время операции.
 * @property {() => Promise<void>} handleStartSelected - Функция для запуска выбранных торрентов.
 * @property {() => Promise<void>} handleStopSelected - Функция для остановки выбранных торрентов.
 * @property {(deleteData?: boolean) => Promise<void>} handleRemoveSelected - Функция для удаления выбранных торрентов.
 * @property {(isSlowMode: boolean) => Promise<void>} handleSetSpeedLimit - Функция для установки ограничения скорости для выбранных торрентов.
 */

/**
 * Хук для управления массовыми операциями (запуск, остановка, удаление, лимит скорости) для выбранных торрентов.
 * Отслеживает состояние выполнения операций и изменения состояний торрентов для определения завершения.
 *
 * @param {TorrentData[]} torrents - Массив всех торрентов.
 * @param {Set<number>} selectedTorrents - Множество ID выбранных торрентов.
 * @param {() => Promise<void>} refreshTorrents - Функция для обновления списка торрентов после операции.
 * @param {Config | undefined} config - Конфигурация приложения, содержащая настройки для лимита скорости.
 * @returns {UseBulkOperationsResult} Объект с состоянием операций, ошибкой и функциями-обработчиками.
 */
export function useBulkOperations(
  torrents: TorrentData[],
  selectedTorrents: Set<number>,
  refreshTorrents: () => Promise<void>,
  config: Config | undefined
): {
  bulkOperations: BulkOperationsState;
  error: string | null;
  handleStartSelected: () => Promise<void>;
  handleStopSelected: () => Promise<void>;
  handleRemoveSelected: (deleteData?: boolean) => Promise<void>;
  handleSetSpeedLimit: (isSlowMode: boolean) => Promise<void>;
} {
  const { t } = useLocalization();
  const [bulkOperations, setBulkOperations] = useState<BulkOperationsState>({
    start: false,
    stop: false,
    remove: false,
    speedLimit: false,
  });
  const [lastBulkAction, setLastBulkAction] = useState<
    "start" | "stop" | "remove" | "speedLimit" | null
  >(null);
  const [lastTorrentStates, setLastTorrentStates] = useState<
    Map<number, string>
  >(new Map());
  const [error, setError] = useState<string | null>(null);

  // Эффект для отслеживания выполнения массовых операций запуска/остановки
  // Сбрасывает флаг операции, когда все выбранные торренты перешли в целевое состояние
  useEffect(() => {
    // Выполняется только если была запущена операция start или stop
    if (!lastBulkAction || !(bulkOperations.start || bulkOperations.stop))
      return;

    const selectedTorrentsArray = Array.from(selectedTorrents);

    // Проверяем, есть ли торренты, которые *могут* быть обработаны (т.е. не в целевом состоянии)
    const hasTorrentsToProcess = selectedTorrentsArray.some((id) => {
      const torrent = torrents.find((t) => t.ID === id);
      if (!torrent) return false; // Торрент мог быть удален

      // Для start: ищем те, что 'stopped'
      if (lastBulkAction === "start") {
        return torrent.Status === "stopped";
      }
      // Для stop: ищем те, что 'downloading' или 'seeding'
      else {
        return torrent.Status === "downloading" || torrent.Status === "seeding";
      }
    });

    // Если нет торрентов, которые нужно обработать (например, все уже запущены при попытке запуска),
    // или если список выбранных торрентов опустел, отменяем операцию.
    if (!hasTorrentsToProcess || selectedTorrentsArray.length === 0) {
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        [lastBulkAction!]: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
      return;
    }

    // Проверяем, изменились ли состояния *всех* выбранных торрентов на целевое
    const allTorrentsChanged = selectedTorrentsArray.every((id) => {
      const torrent = torrents.find((t) => t.ID === id);
      const previousState = lastTorrentStates.get(id);

      // Если торрент не найден (удален?) или нет предыдущего состояния, считаем, что он изменился (или не требует изменения)
      if (!torrent || !previousState) return true;

      // Проверяем, был ли торрент уже в целевом состоянии *до* начала операции
      const wasAlreadyInTargetState =
        (lastBulkAction === "start" &&
          (previousState === "downloading" || previousState === "seeding")) ||
        (lastBulkAction === "stop" && previousState === "stopped");

      // Если он уже был в целевом состоянии, считаем его "измененным" для этой проверки
      if (wasAlreadyInTargetState) return true;

      // Проверяем, изменилось ли состояние на целевое *после* начала операции
      if (lastBulkAction === "start") {
        return (
          previousState !== torrent.Status && // Состояние должно измениться
          (torrent.Status === "downloading" || torrent.Status === "seeding") // Новое состояние - целевое
        );
      }
      // Для stop
      else {
        return (
          previousState !== torrent.Status && // Состояние должно измениться
          torrent.Status === "stopped" // Новое состояние - целевое
        );
      }
    });

    // Если все торренты достигли целевого состояния (или уже были в нем), завершаем операцию
    if (allTorrentsChanged) {
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        [lastBulkAction!]: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [
    torrents,
    selectedTorrents,
    bulkOperations, // Должен быть здесь, т.к. используется в условии if
    lastBulkAction,
    lastTorrentStates,
    // refreshTorrents не нужен, т.к. эффект только читает состояние, а не вызывает обновление
    // t не нужен, т.к. не используется
  ]);

  // Обработчик запуска выбранных торрентов
  const handleStartSelected = useCallback(async () => {
    // Не запускать, если операция уже идет или ничего не выбрано
    if (bulkOperations.start || selectedTorrents.size === 0) return;

    // Фильтруем торренты, которые действительно нужно запустить (в статусе stopped или completed)
    const torrentsToStart = torrents.filter(
      (t) =>
        selectedTorrents.has(t.ID) &&
        (t.Status === "stopped" || t.Status === "completed")
    );

    // Если нет торрентов для запуска, выходим
    if (torrentsToStart.length === 0) return;

    // Сохраняем текущие состояния выбранных торрентов для отслеживания изменений
    const states = new Map(
      torrents
        .filter((t) => selectedTorrents.has(t.ID))
        .map((t) => [t.ID, t.Status])
    );

    // Устанавливаем флаги начала операции
    setBulkOperations((prev: BulkOperationsState) => ({
      ...prev,
      start: true,
    }));
    setLastBulkAction("start");
    setLastTorrentStates(states);
    setError(null); // Сбрасываем предыдущую ошибку

    try {
      // Преобразуем ID в массив чисел для API
      const idsToStart = torrentsToStart.map((t) => Number(t.ID));
      console.log("Starting torrents with IDs:", idsToStart);

      await StartTorrents(idsToStart);
      // Обновляем список торрентов, чтобы увидеть изменения
      await refreshTorrents();
      // Флаг `start: false` будет сброшен в useEffect, когда все торренты запустятся
    } catch (err) {
      console.error("Failed to start torrents:", err);
      setError(t("errors.failedToStartTorrents", String(err)));
      // Сбрасываем флаги в случае ошибки
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        start: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [
    bulkOperations.start,
    selectedTorrents,
    torrents,
    refreshTorrents,
    t,
    // StartTorrents неявно используется, но useCallback не требует его в зависимостях, если он стабилен (импорт)
  ]);

  // Обработчик остановки выбранных торрентов
  const handleStopSelected = useCallback(async () => {
    // Не запускать, если операция уже идет или ничего не выбрано
    if (bulkOperations.stop || selectedTorrents.size === 0) return;

    // Фильтруем торренты, которые действительно нужно остановить (в статусе downloading или seeding)
    const torrentsToStop = torrents.filter(
      (t) =>
        selectedTorrents.has(t.ID) &&
        (t.Status === "downloading" || t.Status === "seeding")
    );

    // Если нет торрентов для остановки, выходим
    if (torrentsToStop.length === 0) return;

    // Сохраняем текущие состояния выбранных торрентов
    const states = new Map(
      torrents
        .filter((t) => selectedTorrents.has(t.ID))
        .map((t) => [t.ID, t.Status])
    );

    // Устанавливаем флаги начала операции
    setBulkOperations((prev: BulkOperationsState) => ({ ...prev, stop: true }));
    setLastBulkAction("stop");
    setLastTorrentStates(states);
    setError(null); // Сбрасываем предыдущую ошибку

    try {
      // Преобразуем ID в массив чисел для API
      const idsToStop = torrentsToStop.map((t) => Number(t.ID));
      console.log("Stopping torrents with IDs:", idsToStop);

      await StopTorrents(idsToStop);
      // Обновляем список торрентов
      await refreshTorrents();
      // Флаг `stop: false` будет сброшен в useEffect, когда все торренты остановятся
    } catch (err) {
      console.error("Failed to stop torrents:", err);
      setError(t("errors.failedToStopTorrents", String(err)));
      // Сбрасываем флаги в случае ошибки
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        stop: false,
      }));
      setLastBulkAction(null);
      setLastTorrentStates(new Map());
    }
  }, [
    bulkOperations.stop,
    selectedTorrents,
    torrents,
    refreshTorrents,
    t,
    // StopTorrents неявно используется
  ]);

  // Обработчик удаления выбранных торрентов
  const handleRemoveSelected = useCallback(
    async (deleteData: boolean = false) => {
      // Не запускать, если операция уже идет или ничего не выбрано
      if (bulkOperations.remove || selectedTorrents.size === 0) return;

      // Устанавливаем флаг начала операции
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        remove: true,
      }));
      setLastBulkAction("remove"); // Устанавливаем для консистентности, хотя useEffect не следит за remove
      setError(null); // Сбрасываем предыдущую ошибку

      try {
        console.log(
          `Removing ${selectedTorrents.size} torrents, deleteData: ${deleteData}`
        );

        const idsToRemove = Array.from(selectedTorrents);
        // Обрабатываем торренты последовательно, чтобы избежать потенциальных проблем с параллельным удалением
        // и чтобы можно было отловить ошибку для конкретного торрента (хотя здесь она только логируется)
        for (const id of idsToRemove) {
          try {
            console.log(
              `Removing torrent ID: ${id}, deleteData: ${deleteData}`
            );
            await RemoveTorrent(Number(id), deleteData);
          } catch (singleError) {
            // Логируем ошибку удаления конкретного торрента, но продолжаем удалять остальные
            console.error(`Failed to remove torrent ${id}:`, singleError);
            // Можно накапливать ошибки, если нужно показать их пользователю
          }
        }

        // Обновляем список торрентов после удаления всех (или попытки удаления)
        await refreshTorrents();
      } catch (err) {
        // Эта ошибка скорее всего не возникнет при последовательном удалении,
        // но оставим на случай общих проблем с refreshTorrents или других непредвиденных ошибок
        console.error("Error in bulk remove operation:", err);
        setError(t("errors.failedToRemoveTorrents", String(err)));
      } finally {
        // Сбрасываем флаги после завершения операции (успешной или с ошибкой)
        setBulkOperations((prev: BulkOperationsState) => ({
          ...prev,
          remove: false,
        }));
        setLastBulkAction(null);
      }
    },
    [bulkOperations.remove, selectedTorrents, refreshTorrents, t] // RemoveTorrent неявно используется
  );

  // Обработчик установки ограничения скорости для выбранных торрентов
  const handleSetSpeedLimit = useCallback(
    async (isSlowMode: boolean) => {
      // Не запускать, если операция уже идет, ничего не выбрано или нет конфигурации
      if (bulkOperations.speedLimit || selectedTorrents.size === 0 || !config)
        return;

      // Устанавливаем флаг начала операции
      setBulkOperations((prev: BulkOperationsState) => ({
        ...prev,
        speedLimit: true,
      }));
      setLastBulkAction("speedLimit"); // Устанавливаем для консистентности
      setError(null); // Сбрасываем предыдущую ошибку

      try {
        console.log(
          `Setting speed limit (slow mode: ${isSlowMode}) for ${selectedTorrents.size} torrents`
        );

        // Получаем IDs выбранных торрентов
        const selectedIds = Array.from(selectedTorrents).map(Number);

        // Применяем ограничение скорости через API
        await SetTorrentSpeedLimit(selectedIds, isSlowMode);

        // Обновляем список торрентов для отображения изменений (например, иконки лимита)
        await refreshTorrents();
      } catch (err) {
        console.error("Failed to set speed limit:", err);
        setError(t("errors.failedToSetSpeedLimit", String(err)));
      } finally {
        // Сбрасываем флаги после завершения операции
        setBulkOperations((prev: BulkOperationsState) => ({
          ...prev,
          speedLimit: false,
        }));
        setLastBulkAction(null);
      }
    },
    [
      bulkOperations.speedLimit,
      selectedTorrents,
      config,
      refreshTorrents,
      t,
      // SetTorrentSpeedLimit неявно используется
    ]
  );

  return {
    bulkOperations,
    error,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit,
  };
}
