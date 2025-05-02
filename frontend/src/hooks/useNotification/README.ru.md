# Хук `useNotification`

## Описание

Хук `useNotification` предоставляет удобный интерфейс для отображения нативных уведомлений операционной системы из React-компонентов с поддержкой локализации. Он служит оберткой вокруг Go-функции `ShowNotification`, которая использует нативные уведомления macOS.

## API

### Возвращаемый результат

```typescript
interface UseNotificationResult {
  showSuccess: (titleKey: string, messageKey: string, formatValues?: Record<string, string | number>) => void;
  showError: (titleKey: string, messageKey: string, formatValues?: Record<string, string | number>) => void;
  showInfo: (titleKey: string, messageKey: string, formatValues?: Record<string, string | number>) => void;
  showWarning: (titleKey: string, messageKey: string, formatValues?: Record<string, string | number>) => void;
  showFormatted: (titleKey: string, messageKey: string, formatValues: Record<string, string | number>, level: NotificationLevel) => void;
  showDirect: (title: string, message: string, level: NotificationLevel) => void;
}
```

### Методы

| Метод | Описание |
|-------|----------|
| `showSuccess` | Показывает успешное уведомление (зеленое) с локализованным заголовком и сообщением |
| `showError` | Показывает уведомление об ошибке (красное) с локализованным заголовком и сообщением |
| `showInfo` | Показывает информационное уведомление (синее) с локализованным заголовком и сообщением |
| `showWarning` | Показывает предупреждающее уведомление (оранжевое) с локализованным заголовком и сообщением |
| `showFormatted` | Показывает уведомление с локализованным заголовком и сообщением с возможностью форматирования |
| `showDirect` | Показывает уведомление с прямыми строками без локализации (для специальных случаев) |

## Использование

```typescript
import React from 'react';
import { useNotification } from '@/hooks/useNotification';

const MyComponent: React.FC = () => {
  const { showSuccess, showError, showInfo, showWarning, showFormatted, showDirect } = useNotification();

  const handleSuccessAction = () => {
    // Показать успешное уведомление с локализованным заголовком и сообщением
    showSuccess("notifications.successTitle", "notifications.operationSuccess");
  };

  const handleErrorAction = () => {
    // Показать уведомление об ошибке с локализованным заголовком и сообщением
    showError("notifications.errorTitle", "notifications.operationFailed");
  };
  
  const handleInfoAction = () => {
    // Показать информационное уведомление с локализованным заголовком и сообщением
    showInfo("notifications.infoTitle", "notifications.syncStarted");
  };
  
  const handleWarningAction = () => {
    // Показать предупреждающее уведомление с локализованным заголовком и сообщением
    showWarning("notifications.warningTitle", "notifications.possibleDelay");
  };
  
  const handleFormattedMessage = () => {
    // Показать форматированное уведомление с использованием локализации и параметров
    showSuccess(
      "notifications.downloadCompleteTitle", 
      "notifications.downloadCompleteMessage", 
      { name: "Ubuntu.iso", speed: "10 MB/s" }
    );
  };
  
  const handleDirectMessage = () => {
    // Показать уведомление с прямыми строками без локализации (для специальных случаев)
    showDirect(
      "Прямой заголовок", 
      "Прямое сообщение без локализации",
      "info"
    );
  };

  return (
    <div>
      <button onClick={handleSuccessAction}>Показать успешное уведомление</button>
      <button onClick={handleErrorAction}>Показать уведомление об ошибке</button>
      <button onClick={handleInfoAction}>Показать информационное уведомление</button>
      <button onClick={handleWarningAction}>Показать предупреждающее уведомление</button>
      <button onClick={handleFormattedMessage}>Показать форматированное уведомление</button>
      <button onClick={handleDirectMessage}>Показать прямое уведомление</button>
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
- `@contexts/LocalizationContext` (для локализации и форматирования сообщений)
- Wails:
  - `@wailsjs/go/main/App` (для функции ShowNotification)
  - `@wailsjs/runtime` (для LogError)

## Примечания

1. Отображение нативных уведомлений зависит от доступности и разрешений операционной системы. В случае проблем с отображением, проверьте настройки уведомлений в системе.
2. Для всех методов, кроме `showDirect`, необходимо передавать ключи локализации, а не готовые строки. Это обеспечивает правильную локализацию уведомлений в соответствии с выбранным языком интерфейса.