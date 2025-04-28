# Хук `useNotification`

## Описание

Хук `useNotification` предоставляет удобный интерфейс для отображения нативных уведомлений операционной системы из React-компонентов. Он служит оберткой вокруг Go-функции `ShowNotification`, которая использует нативные уведомления macOS.

## API

### Возвращаемый результат

```typescript
interface UseNotificationResult {
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showFormatted: (title: string, messageKey: string, formatValues: Record<string, string | number>, level: NotificationLevel) => void;
}
```

### Методы

| Метод | Описание |
|-------|----------|
| `showSuccess` | Показывает успешное уведомление (зеленое) |
| `showError` | Показывает уведомление об ошибке (красное) |
| `showInfo` | Показывает информационное уведомление (синее) |
| `showWarning` | Показывает предупреждающее уведомление (оранжевое) |
| `showFormatted` | Показывает уведомление с локализованным сообщением и возможностью форматирования |

## Использование

```typescript
import React from 'react';
import { useNotification } from '@/hooks/useNotification';

const MyComponent: React.FC = () => {
  const { showSuccess, showError, showInfo, showWarning, showFormatted } = useNotification();

  const handleSuccessAction = () => {
    // Показать успешное уведомление
    showSuccess("Успех", "Операция выполнена успешно");
  };

  const handleErrorAction = () => {
    // Показать уведомление об ошибке
    showError("Ошибка", "Не удалось выполнить операцию");
  };
  
  const handleInfoAction = () => {
    // Показать информационное уведомление
    showInfo("Информация", "Синхронизация началась");
  };
  
  const handleWarningAction = () => {
    // Показать предупреждающее уведомление
    showWarning("Предупреждение", "Возможна задержка в работе");
  };
  
  const handleFormattedMessage = () => {
    // Показать форматированное уведомление с использованием локализации
    showFormatted(
      "Загрузка завершена", 
      "torrent.downloadedWithSpeed", 
      { name: "Ubuntu.iso", speed: "10 MB/s" },
      "success"
    );
  };

  return (
    <div>
      <button onClick={handleSuccessAction}>Показать успешное уведомление</button>
      <button onClick={handleErrorAction}>Показать уведомление об ошибке</button>
      <button onClick={handleInfoAction}>Показать информационное уведомление</button>
      <button onClick={handleWarningAction}>Показать предупреждающее уведомление</button>
      <button onClick={handleFormattedMessage}>Показать форматированное уведомление</button>
    </div>
  );
};

export default MyComponent;
```

## Обработка ошибок

Хук автоматически обрабатывает ошибки, которые могут возникнуть при отправке уведомлений. При возникновении ошибки:
1. Ошибка логируется через `LogError` из Wails Runtime
2. Дополнительно выводится в консоль разработчика с префиксом `[Notification Error]`

## Зависимости

- React (useCallback)
- `@contexts/LocalizationContext` (для форматированных сообщений)
- Wails:
  - `@wailsjs/go/main/App` (для функции ShowNotification)
  - `@wailsjs/runtime` (для LogError)

## Примечания

Отображение нативных уведомлений зависит от доступности и разрешений операционной системы. В случае проблем с отображением, проверьте настройки уведомлений в системе.