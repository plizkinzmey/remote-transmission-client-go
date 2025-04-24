# Хук useAppErrorHandler

## Описание

Хук `useAppErrorHandler` централизует и приоритизирует обработку ошибок из различных источников в приложении (соединение, конфигурация, список торрентов, статистика сессии). Он определяет наиболее критическую ошибку для отображения на основе заданных приоритетов.

## Использование

```typescript
import { useAppErrorHandler } from '@hooks/useAppErrorHandler';

function App() {
  // ... другие хуки, предоставляющие состояния ошибок ...
  const { error: connectionError, setConnectionError, setIsReconnectingState } = useConnectionManager();
  const { error: configError } = useConfigManager(...);
  const { error: torrentListError } = useTorrentList(...);
  const { error: sessionStatsError } = useSessionStats(...);

  const appError = useAppErrorHandler(
    { connectionError, configError, torrentListError, sessionStatsError },
    { setConnectionError, setIsReconnectingState }
  );

  // ... рендеринг на основе appError ...
}
```

## Приоритет ошибок

1.  Ошибка соединения (`connectionError`)
2.  Ошибка конфигурации (`configError`)
3.  Ошибка списка торрентов (`torrentListError`) - Инициирует попытку переподключения.
4.  Ошибка статистики сессии (`sessionStatsError`)

Если ошибок нет, хук возвращает `null`.
