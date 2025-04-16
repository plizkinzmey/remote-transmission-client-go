# Компонент ConnectionTab

## Назначение

Компонент `ConnectionTab` предоставляет пользовательский интерфейс для настройки и тестирования параметров подключения к RPC-серверу Transmission. Он позволяет пользователям вводить хост, порт, имя пользователя и пароль.

## Пропсы

-   `settings: ConnectionConfig`: Объект, содержащий текущие настройки подключения (`host`, `port`, `username`, `password`).
-   `onSettingsChange: (newSettings: Partial<ConnectionConfig>) => void`: Функция обратного вызова, вызываемая при изменении любого значения настройки. Получает объект с измененной настройкой(ами).
-   `onConnectionTest?: (success: boolean, errorMessage?: string) => void`: Необязательная функция обратного вызова, вызываемая после выполнения теста соединения. Получает `true` в случае успеха или `false` и сообщение об ошибке в случае неудачи. Это позволяет родительскому компоненту отображать статус соединения.
-   `errors?: { [key: string]: string }`: Необязательный объект, содержащий ошибки валидации для полей ввода (например, `{ host: "Хост обязателен" }`).

## Пример использования

```tsx
import React, { useState } from 'react';
import { ConnectionTab } from './'; // Предполагается импорт из index.ts
import { ConnectionConfig } from '../../App'; // При необходимости скорректируйте путь
import { StatusMessage } from '../StatusMessage'; // При необходимости скорректируйте путь

const SettingsPage = () => {
  const [settings, setSettings] = useState<ConnectionConfig>({
    host: 'localhost',
    port: 9091,
    username: '',
    password: '',
  });
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState({}); // Добавьте логику валидации при необходимости

  const handleSettingsChange = (newSettings: Partial<ConnectionConfig>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    setConnectionTestResult(null); // Сброс статуса теста при изменении
    // Добавьте сюда логику валидации и обновите validationErrors
  };

  const handleConnectionTest = (success: boolean, message?: string) => {
    setConnectionTestResult({ success, message });
  };

  return (
    <div>
      <h2>Настройки соединения</h2>
      {connectionTestResult && (
         <StatusMessage
            type={connectionTestResult.success ? 'success' : 'error'}
            message={connectionTestResult.message || (connectionTestResult.success ? 'Соединение успешно!' : 'Ошибка соединения!')}
         />
      )}
      <ConnectionTab
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onConnectionTest={handleConnectionTest}
        errors={validationErrors}
      />
      {/* Другие вкладки настроек */}
    </div>
  );
};
```

## Зависимости

-   React
-   `@radix-ui/themes` (для UI-компонентов, таких как `TextField`, `Flex`, `Button` и т.д.)
-   `useLocalization` (из `../../contexts/LocalizationContext`) для интернационализации.
-   Функция Wails Go: `TestConnection` (из `../../../wailsjs/go/main/App`) для тестирования соединения.

## Детали реализации

-   **Логика соединения:** Логика обработки теста соединения, включая управление состояниями загрузки и разбор потенциальных ошибок, инкапсулирована в кастомном хуке `useConnectionTest` (`./hooks/useConnectionTest.ts`).
-   **Управление состоянием:** Компонент использует хук `useState` внутри `useConnectionTest` для управления состоянием тестирования. Состояние конфигурации (`settings`) управляется родительским компонентом.
-   **Стилизация:** Используются CSS-модули (`ConnectionTab.module.css`) для стилизации, минимизируя инлайн-стили.
-   **Тестирование:** Модульные тесты должны охватывать рендеринг, изменения ввода, отображение ошибок валидации и логику теста соединения (сценарии успеха/неудачи). Для ключевых интерактивных элементов предоставлены идентификаторы тестов (`data-testid`).
