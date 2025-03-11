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
            refreshTorrents();
          } catch (initError) {
            console.error('Failed to connect with saved settings:', initError);
            setError(`Connection failed: ${initError}. Please check your settings.`);
            // Показываем окно настроек при ошибке инициализации
            setShowSettings(true);
          }
        } else {
          // Если настроек нет, показываем окно настроек
          setShowSettings(true);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        setError(`Failed to load configuration: ${error}`);
        // В случае ошибки тоже показываем окно настроек
        setShowSettings(true);
      }
    };

    initializeApp();
  }, []);

  const refreshTorrents = async () => {
    try {
      const response = await GetTorrents();
      setTorrents(response);
      // Если получение данных успешно, сбрасываем ошибки
      setError(null);
    } catch (error) {
      console.error('Failed to fetch torrents:', error);
      setError(`Failed to fetch torrents: ${error}`);
    }
  };

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
            <Button onClick={refreshTorrents}>Refresh</Button>
            <Button onClick={() => setShowAddTorrent(true)}>Add Torrent</Button>
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
              // Закрываем окно настроек только если уже есть инициализация
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
