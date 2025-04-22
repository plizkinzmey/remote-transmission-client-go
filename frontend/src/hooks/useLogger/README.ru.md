# Хук `useLogger`

Этот хук предоставляет простую утилиту логирования, которая автоматически добавляет контекст (обычно имя компонента) к каждому сообщению лога перед отправкой его в логгер среды выполнения Wails.

## Использование

Импортируйте хук и вызовите его внутри вашего функционального компонента, указав строку контекста.

```typescript
import React from 'react';
import { useLogger } from '@/hooks/useLogger'; // При необходимости скорректируйте путь импорта

const MyComponent: React.FC = () => {
  const logger = useLogger('MyComponent');

  const handleClick = () => {
    logger.info('Кнопка нажата');
    // Логирует: [MyComponent] Кнопка нажата

    try {
      // Какая-то операция, которая может завершиться ошибкой
      throw new Error('Что-то пошло не так');
    } catch (error) {
      logger.error('Операция не удалась', { error });
      // Логирует: [MyComponent] Операция не удалась {"error":{}}
    }
  };

  return <button onClick={handleClick}>Нажми меня</button>;
};

export default MyComponent;
```

## API

### `useLogger(context: string): Logger`

-   **`context`**: `string` - Строковый идентификатор для контекста логирования (например, имя компонента).
-   **Возвращает**: `Logger` - Объект, содержащий методы логирования.

### Интерфейс `Logger`

Возвращаемый объект `Logger` имеет следующие методы:

-   **`debug(message: string, data?: object): void`**: Логирует отладочное сообщение.
-   **`info(message: string, data?: object): void`**: Логирует информационное сообщение.
-   **`warn(message: string, data?: object): void`**: Логирует предупреждающее сообщение.
-   **`error(message: string, data?: object): void`**: Логирует сообщение об ошибке.

Каждый метод принимает строку `message` и необязательный объект `data`. Объект `data` будет преобразован в строку с помощью `JSON.stringify` и добавлен к сообщению лога.

## Зависимости

Этот хук зависит от функций логирования среды выполнения Wails (`LogDebug`, `LogInfo`, `LogWarning`, `LogError`), доступных глобально.
