import { useState, useEffect } from 'react';
import { Button } from './components/Button';
import { TorrentItem } from './components/TorrentItem';
import { Settings } from './components/Settings';
import { AddTorrent } from './components/AddTorrent';
import styles from './styles/App.module.css';
import './App.css';

import { GetTorrents, AddTorrent as AddTorrentAPI, AddTorrentFile, RemoveTorrent, Initialize, LoadConfig } from '../wailsjs/go/main/App';

interface Torrent {
  ID: number;
  Name: string;
  Status: string;
  Progress: number;
}

interface Config {
  host: string;
  port: number;
  username: string;
  password: string;
}

function App() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;

  // Функция переподключения к серверу
  const reconnect = async () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      setError('Maximum reconnection attempts reached. Please check your connection settings.');
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    try {
      const savedConfig = await LoadConfig();
      if (savedConfig) {
        await Initialize(JSON.stringify(savedConfig));
        setError(null);
        setIsReconnecting(false);
        setReconnectAttempts(0);
        return true;
      }
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      setReconnectAttempts(prev => prev + 1);
      return false;
    }
  };

  // Функция обновления списка торрентов
  const refreshTorrents = async () => {
    try {
      const response = await GetTorrents();
      setTorrents(response);
      
      // Сбрасываем ошибки и счетчик попыток переподключения при успешном запросе
      setError(null);
      setReconnectAttempts(0);
      setIsReconnecting(false);
    } catch (error) {
      console.error('Failed to fetch torrents:', error);
      
      // Если это ошибка соединения, пытаемся переподключиться
      if (!isReconnecting) {
        setError(`Connection lost. Attempting to reconnect... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        const reconnected = await reconnect();
        if (!reconnected) {
          setError(`Failed to reconnect. Retrying in 3 seconds... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        }
      }
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Загружаем сохраненные настройки
        const savedConfig = await LoadConfig();
        
        if (savedConfig) {
          try {
            // Если есть сохраненные настройки, используем их
            await Initialize(JSON.stringify(savedConfig));
            setIsInitialized(true);
            refreshTorrents(); // Первоначальная загрузка
          } catch (initError) {
            console.error('Failed to connect with saved settings:', initError);
            setError(`Connection failed: ${initError}. Please check your settings.`);
            setShowSettings(true);
          }
        } else {
          setShowSettings(true);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        setError(`Failed to load configuration: ${error}`);
        setShowSettings(true);
      }
    };

    initializeApp();
  }, []);

  // Эффект для автоматического обновления списка торрентов
  useEffect(() => {
    let intervalId: number;

    if (isInitialized) {
      // Запускаем первоначальное обновление
      refreshTorrents();

      // Устанавливаем интервал обновления каждые 3 секунды
      intervalId = window.setInterval(refreshTorrents, 3000);
    }

    // Очистка при размонтировании
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [isInitialized]);

  const handleAddTorrent = async (url: string) => {
    try {
      await AddTorrentAPI(url);
      refreshTorrents();
    } catch (error) {
      console.error('Failed to add torrent:', error);
      setError(`Failed to add torrent: ${error}`);
    }
  };

  const handleAddTorrentFile = async (base64Content: string) => {
    try {
      await AddTorrentFile(base64Content);
      refreshTorrents();
    } catch (error) {
      console.error('Failed to add torrent file:', error);
      setError(`Failed to add torrent file: ${error}`);
    }
  };

  const handleRemoveTorrent = async (id: number) => {
    try {
      await RemoveTorrent(id, false);
      refreshTorrents();
    } catch (error) {
      console.error('Failed to remove torrent:', error);
      setError(`Failed to remove torrent: ${error}`);
    }
  };

  const handleSettingsSave = async (settings: Config) => {
    try {
      await Initialize(JSON.stringify(settings));
      setShowSettings(false);
      setIsInitialized(true);
      setError(null); // Сбрасываем ошибки при успешном сохранении настроек
      refreshTorrents();
    } catch (error) {
      console.error('Failed to update settings:', error);
      setError(`Failed to connect with new settings: ${error}`);
      // Оставляем окно настроек открытым в случае ошибки
    }
  };

  const filteredTorrents = torrents.filter(torrent =>
    torrent.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isInitialized && !showSettings) {
    return <div className={styles.noSelect}>Connecting to Transmission...</div>;
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.content}>
        <div className={styles.controlPanel}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search torrents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className={styles.actions}>
            <Button onClick={() => setShowSettings(true)}>Settings</Button>
            <Button onClick={() => setShowAddTorrent(true)}>Add Torrent</Button>
            {isReconnecting && <div className={styles.reconnectingStatus}>Reconnecting...</div>}
          </div>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.torrentList}>
          {filteredTorrents.length > 0 ? (
            filteredTorrents.map((torrent) => (
              <TorrentItem
                key={torrent.ID}
                id={torrent.ID}
                name={torrent.Name}
                status={torrent.Status}
                progress={torrent.Progress}
                onRemove={handleRemoveTorrent}
              />
            ))
          ) : (
            <div className={styles.noTorrents}>
              {searchTerm ? 'No torrents found matching your search' : 'No torrents added yet'}
            </div>
          )}
        </div>

        {showSettings && (
          <Settings
            onSave={handleSettingsSave}
            onClose={() => {
              if (isInitialized) {
                setShowSettings(false);
              }
            }}
          />
        )}

        {showAddTorrent && (
          <AddTorrent
            onAdd={handleAddTorrent}
            onAddFile={handleAddTorrentFile}
            onClose={() => setShowAddTorrent(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
