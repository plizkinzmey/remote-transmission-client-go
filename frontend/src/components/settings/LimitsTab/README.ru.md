# Компонент LimitsTab

## Описание

Компонент `LimitsTab` предоставляет пользовательский интерфейс для настройки лимитов скорости и максимального коэффициента раздачи в настройках клиента Transmission. Он позволяет пользователям устанавливать максимальный коэффициент раздачи, а также определять порог и единицы измерения для режима "медленной скорости".

## Пропсы

-   **`settings`**: `ConnectionConfig`
    -   Объект, содержащий текущую конфигурацию соединения, включая `maxUploadRatio`, `slowSpeedLimit` и `slowSpeedUnit`.
-   **`onSettingsChange`**: `(newSettings: Partial<ConnectionConfig>) => void`
    -   Колбэк-функция, вызываемая при изменении любого параметра лимитов пользователем. Получает частичный объект `ConnectionConfig`, содержащий только обновленные настройки.
-   **`errors`**: `{ [key: string]: string }` (опционально)
    -   Объект, содержащий ошибки валидации для полей ввода. Ключи соответствуют именам настроек (`maxUploadRatio`, `slowSpeedLimit`), а значения - сообщения об ошибках для отображения. По умолчанию - пустой объект.

## Пример использования

```tsx
import React, { useState } from 'react';
import { LimitsTab } from './LimitsTab';
import { ConnectionConfig } from '../../../App'; // Настройте путь при необходимости

const SettingsContainer: React.FC = () => {
  const [settings, setSettings] = useState<ConnectionConfig>({
    // ... другие настройки
    maxUploadRatio: 2.0,
    slowSpeedLimit: 50,
    slowSpeedUnit: 'KiB/s',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSettingsChange = (newSettings: Partial<ConnectionConfig>) => {
    // Выполните валидацию при необходимости
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    // Очистите или установите ошибки на основе валидации
    // setErrors(validationResult);
  };

  return (
    <LimitsTab
      settings={settings}
      onSettingsChange={handleSettingsChange}
      errors={errors}
    />
  );
};
```

## Зависимости

-   React
-   `@radix-ui/themes` (TextField, Select, Flex, Text, Grid, Box)
-   Хук `useLocalization` (из `../../../contexts/LocalizationContext`)
-   Тип `ConnectionConfig` (из `../../../App`)

## Детали реализации

-   Компонент использует управляемые поля ввода (`TextField.Root`, `Select.Root`), привязанные к пропсу `settings`.
-   Изменения в полях ввода вызывают колбэк `onSettingsChange` с обновленными значениями.
-   Пустые строки в числовых полях (`maxUploadRatio`, `slowSpeedLimit`) обрабатываются как `0`. Нечисловые значения также обрабатываются как `0`.
-   Ошибки валидации, переданные через пропс `errors`, отображаются под соответствующими полями ввода.
-   Инлайн-стили для ширины полей ввода перенесены в `LimitsTab.module.css`.
