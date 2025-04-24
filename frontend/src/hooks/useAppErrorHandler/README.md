# useAppErrorHandler Hook

## Description

The `useAppErrorHandler` hook centralizes and prioritizes error handling from various sources within the application (connection, configuration, torrent list, session stats). It determines the most critical error to display based on predefined priorities.

## Usage

```typescript
import { useAppErrorHandler } from '@hooks/useAppErrorHandler';

function App() {
  // ... other hooks providing error states ...
  const { error: connectionError, setConnectionError, setIsReconnectingState } = useConnectionManager();
  const { error: configError } = useConfigManager(...);
  const { error: torrentListError } = useTorrentList(...);
  const { error: sessionStatsError } = useSessionStats(...);

  const appError = useAppErrorHandler(
    { connectionError, configError, torrentListError, sessionStatsError },
    { setConnectionError, setIsReconnectingState }
  );

  // ... render based on appError ...
}
```

## Error Priority

1.  Connection Error (`connectionError`)
2.  Configuration Error (`configError`)
3.  Torrent List Error (`torrentListError`) - Triggers reconnection attempt.
4.  Session Stats Error (`sessionStatsError`)

If no errors are present, the hook returns `null`.
