# Хук `useModals`

## Обзор

Хук `useModals` отвечает за управление состоянием видимости различных модальных окон в приложении, в частности, модального окна настроек и модального окна добавления торрента.

Он также обрабатывает логику первого запуска приложения (автоматическое отображение окна настроек) и обрабатывает ввод торрент-файлов, как через перетаскивание (drag-and-drop), так и через события `torrent-opened`, генерируемые бэкендом.

## Использование

Импортируйте хук и деструктурируйте необходимые переменные состояния и функции:

```typescript
import { useModals } from '@/hooks/useModals';

function MyComponent() {
  const {
    showSettings,
    showAddTorrent,
    openSettings,
    closeSettings,
    openAddTorrent,
    closeAddTorrent,
    // ... другие свойства при необходимости
  } = useModals();

  // Используйте состояние и функции для управления модальными окнами
  return (
    <div>
      <button onClick={openSettings}>Открыть настройки</button>
      {/* Отображение SettingsModal на основе showSettings */}

      <button onClick={openAddTorrent}>Добавить торрент вручную</button>
      {/* Отображение AddTorrentModal на основе showAddTorrent */}
    </div>
  );
}
```

## Возвращаемое значение (`UseModalsReturn`)

Хук возвращает объект со следующими свойствами:

-   `showSettings: boolean`: Видно ли в данный момент модальное окно настроек.
-   `showAddTorrent: boolean`: Видно ли в данный момент модальное окно добавления торрента.
-   `torrentFilePath: string | null`: Путь к файлу торрента, полученному через событие `torrent-opened`. В противном случае `null`.
-   `isFirstStart: boolean`: `true`, если приложение определило, что запускается впервые (конфигурация не найдена), иначе `false`.
-   `torrentFileData: TorrentFileData | null`: Объект `{ name: string, data: string }`, содержащий имя и данные (base64) торрент-файла, перетащенного в приложение. В противном случае `null`.
-   `checkFirstStart: (isReconnecting: boolean) => Promise<void>`: Асинхронная функция для проверки, является ли запуск первым. Пытается загрузить конфигурацию. Если конфигурация не найдена или загрузка не удалась, устанавливает `isFirstStart` и `showSettings` в `true`. Обычно вызывается один раз при загрузке приложения. Параметр `isReconnecting` должен быть `true`, если проверка происходит во время попытки переподключения, чтобы избежать неверного срабатывания логики первого запуска.
-   `handleSuccessfulSettingsSave: () => void`: Функция, которую следует вызвать после того, как пользователь успешно сохранит настройки в первый раз. Устанавливает `isFirstStart` и `showSettings` в `false`.
-   `openSettings: () => void`: Открывает модальное окно настроек (`showSettings = true`).
-   `closeSettings: () => void`: Закрывает модальное окно настроек (`showSettings = false`), но только если `isFirstStart` равно `false`.
-   `openAddTorrent: () => void`: Открывает модальное окно добавления торрента (`showAddTorrent = true`).
-   `closeAddTorrent: () => void`: Закрывает модальное окно добавления торрента (`showAddTorrent = false`) и сбрасывает `torrentFilePath` и `torrentFileData` в `null`.
-   `handleTorrentFileDrop: (fileName: string, fileData: string) => void`: Обрабатывает перетащенный торрент-файл. Устанавливает `torrentFileData` с предоставленным именем и данными (base64) и открывает модальное окно добавления торрента (`showAddTorrent = true`).

## Зависимости

-   `@wailsjs/runtime`: Используется для `EventsOn` для прослушивания событий бэкенда (`torrent-opened`).
-   `@wailsjs/go/main/App`: Используется для `LoadConfig` для проверки наличия существующей конфигурации во время проверки первого запуска.

## Логика первого запуска

1.  Вызывается функция `checkFirstStart` (обычно при загрузке приложения).
2.  Она пытается загрузить конфигурацию с помощью `LoadConfig`.
3.  Если `LoadConfig` возвращает `null`, `undefined` или выбрасывает ошибку, хук предполагает, что приложение запускается впервые.
4.  `isFirstStart` устанавливается в `true`.
5.  `showSettings` устанавливается в `true`, автоматически открывая модальное окно настроек.
6.  Функция `closeSettings` *не будет* закрывать модальное окно, пока `isFirstStart` равно `true`.
7.  После того, как пользователь сохранит начальные настройки, следует вызвать `handleSuccessfulSettingsSave`.
8.  Это установит `isFirstStart` в `false` и закроет модальное окно настроек (`showSettings = false`).
9.  Последующие вызовы `closeSettings` будут работать как ожидается.
