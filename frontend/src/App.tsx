import { useState, useEffect } from 'react';
import { Button } from './components/Button';
import { TorrentItem } from './components/TorrentItem';
import { Settings } from './components/Settings';
import { AddTorrent } from './components/AddTorrent';
import styles from './styles/App.module.css';
import './App.css';

import { GetTorrents, AddTorrent as AddTorrentAPI, RemoveTorrent, Initialize } from '../wailsjs/go/main/App';

interface Torrent {
  ID: number;
  Name: string;
  Status: string;
  Progress: number;
}

function App() {
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTorrent, setShowAddTorrent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await Initialize(JSON.stringify({
          host: 'http://localhost',
          port: 9091,
          username: '',
          password: ''
        }));
        setIsInitialized(true);
        refreshTorrents();
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    initializeApp();
  }, []);

  const refreshTorrents = async () => {
    try {
      const response = await GetTorrents();
      setTorrents(response);
    } catch (error) {
      console.error('Failed to fetch torrents:', error);
    }
  };

  const handleAddTorrent = async (url: string) => {
    try {
      await AddTorrentAPI(url);
      refreshTorrents();
    } catch (error) {
      console.error('Failed to add torrent:', error);
    }
  };

  const handleRemoveTorrent = async (id: number) => {
    try {
      await RemoveTorrent(id, false);
      refreshTorrents();
    } catch (error) {
      console.error('Failed to remove torrent:', error);
    }
  };

  const handleSettingsSave = async (settings: any) => {
    try {
      await Initialize(JSON.stringify(settings));
      setShowSettings(false);
      refreshTorrents();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const filteredTorrents = torrents.filter(torrent =>
    torrent.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isInitialized) {
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
            onClose={() => setShowSettings(false)}
          />
        )}

        {showAddTorrent && (
          <AddTorrent
            onAdd={handleAddTorrent}
            onClose={() => setShowAddTorrent(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
