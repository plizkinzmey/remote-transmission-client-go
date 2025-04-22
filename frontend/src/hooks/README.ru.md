# Пользовательские Хуки

Эта директория содержит пользовательские хуки React, используемые в frontend-приложении Transmission Client.

## Доступные Хуки

### `useBulkOperations`

Управляет массовыми операциями (запуск, остановка, удаление, установка лимита скорости) для выбранных торрентов.

**Назначение:**

-   Предоставляет функции для инициации массовых действий над набором выбранных торрентов.
-   Отслеживает прогресс операций `start` и `stop`, наблюдая за изменениями статусов торрентов.
-   Обрабатывает вызовы API к бэкенду для выполнения этих операций.
-   Управляет состояниями загрузки (`bulkOperations`) и сообщает об ошибках (`error`) для этих операций.

**Параметры:**

-   `torrents` (`TorrentData[]`): Массив всех отображаемых в данный момент торрентов.
-   `selectedTorrents` (`Set<number>`): Множество, содержащее ID текущих выбранных торрентов.
-   `refreshTorrents` (`() => Promise<void>`): Функция обратного вызова для обновления списка торрентов после завершения или сбоя операции.
-   `config` (`Config | undefined`): Объект конфигурации приложения, необходимый для операции `handleSetSpeedLimit`. Содержит `slowSpeedLimit` и `slowSpeedUnit`.

**Возвращает:** (`object`)

-   `bulkOperations` (`BulkOperationsState`): Объект, указывающий, какие массовые операции выполняются в данный момент (`start`, `stop`, `remove`, `speedLimit`).
-   `error` (`string | null`): Сообщение об ошибке, если массовая операция завершилась неудачно, иначе `null`.
-   `handleStartSelected` (`() => Promise<void>`): Функция для запуска выбранных торрентов, которые в данный момент остановлены.
-   `handleStopSelected` (`() => Promise<void>`): Функция для остановки выбранных торрентов, которые в данный момент запущены (скачиваются или раздаются).
-   `handleRemoveSelected` (`(deleteData?: boolean) => Promise<void>`): Функция для удаления выбранных торрентов. Опционально принимает `deleteData` (по умолчанию `false`), чтобы также удалить скачанные файлы.
-   `handleSetSpeedLimit` (`(isSlowMode: boolean) => Promise<void>`): Функция для включения или отключения медленного режима ограничения скорости для выбранных торрентов на основе аргумента `isSlowMode` и объекта `config`.

**Пример использования:**

```typescript
import { useBulkOperations } from '@hooks/useBulkOperations';
import { useTorrentData } from '@hooks/useTorrentData'; // Предполагая, что этот хук предоставляет торренты и логику обновления

function TorrentToolbar({ selectedTorrents, config }) {
  const { torrents, refreshTorrents } = useTorrentData(); // Получаем торренты и функцию обновления
  const {
    bulkOperations,
    error,
    handleStartSelected,
    handleStopSelected,
    handleRemoveSelected,
    handleSetSpeedLimit,
  } = useBulkOperations(torrents, selectedTorrents, refreshTorrents, config);

  return (
    <div>
      <button onClick={handleStartSelected} disabled={bulkOperations.start}>
        {bulkOperations.start ? 'Запуск...' : 'Запустить'}
      </button>
      <button onClick={handleStopSelected} disabled={bulkOperations.stop}>
        {bulkOperations.stop ? 'Остановка...' : 'Остановить'}
      </button>
      <button onClick={() => handleRemoveSelected(false)} disabled={bulkOperations.remove}>
        {bulkOperations.remove ? 'Удаление...' : 'Удалить'}
      </button>
      {/* ... другие кнопки ... */}
      {error && <div style={{ color: 'red' }}>Ошибка: {error}</div>}
    </div>
  );
}
```

---

*(Добавляйте описания других хуков здесь по мере их создания/рефакторинга)*
