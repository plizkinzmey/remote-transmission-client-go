import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Button } from './components/Button';
import { TorrentItem } from './components/TorrentItem';
import { Settings } from './components/Settings';
import { AddTorrent } from './components/AddTorrent';
import './App.css';

import { GetTorrents, AddTorrent as AddTorrentAPI, RemoveTorrent, Initialize } from '../wailsjs/go/main/App';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  -webkit-app-region: drag;
  background: #f8f9fa;
`;

const TitleBar = styled.div`
  height: 38px;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  -webkit-app-region: drag;
`;

const TitleText = styled.div`
  color: white;
  font-size: 14px;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  -webkit-app-region: no-drag;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 12px;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  background: white;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TorrentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NoTorrents = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
`;

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
    return <div>Connecting to Transmission...</div>;
  }

  return (
    <AppContainer>
      <TitleBar>
        <TitleText>Transmission Client</TitleText>
      </TitleBar>
      
      <Content>
        <Header>
          <SearchInput
            type="text"
            placeholder="Search torrents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={() => setShowSettings(true)}>Settings</Button>
          <Button onClick={refreshTorrents}>Refresh</Button>
          <Button onClick={() => setShowAddTorrent(true)}>Add Torrent</Button>
        </Header>

        <TorrentList>
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
            <NoTorrents>
              {searchTerm ? 'No torrents found matching your search' : 'No torrents added yet'}
            </NoTorrents>
          )}
        </TorrentList>

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
      </Content>
    </AppContainer>
  );
}

export default App;
