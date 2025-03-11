import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';
import { TestConnection, LoadConfig } from '../../wailsjs/go/main/App';

interface SettingsProps {
  onSave: (settings: {
    host: string;
    port: number;
    username: string;
    password: string;
  }) => void;
  onClose: () => void;
}

// Создаем тип-псевдоним для статуса соединения
type ConnectionStatusType = 'success' | 'error' | 'none';

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 400px;
  z-index: 1000;
`;

const ModalHeader = styled.div`
  background: #1a1a1a;
  padding: 12px 16px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  user-select: none;

  h2 {
    color: white;
    font-size: 14px;
    margin: 0;
    font-weight: 500;
  }
`;

const ModalContent = styled.div`
  padding: 24px;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #2c3e50;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

// Улучшаем стили для сообщений о статусе соединения
const StatusMessage = styled.div<{ status: ConnectionStatusType }>`
  padding: 8px;
  margin-top: 16px;
  border-radius: 4px;
  font-size: 14px;
  color: ${props => getStatusColor(props.status, 'text')};
  background-color: ${props => getStatusColor(props.status, 'bg')};
  display: ${props => props.status === 'none' ? 'none' : 'block'};
`;

// Вспомогательная функция для определения цветов статуса
function getStatusColor(status: ConnectionStatusType, type: 'text' | 'bg'): string {
  if (status === 'success') {
    return type === 'text' ? '#27ae60' : '#e8f8f5';
  }
  if (status === 'error') {
    return type === 'text' ? '#e74c3c' : '#fdedec';
  }
  return 'transparent';
}

const defaultSettings = {
  host: 'localhost',
  port: 9091,
  username: '',
  password: '',
};

export const Settings: React.FC<SettingsProps> = ({ onSave, onClose }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('none');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        const savedConfig = await LoadConfig();
        if (savedConfig) {
          setSettings(savedConfig);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  const handleTestConnection = async () => {
    try {
      await TestConnection(JSON.stringify(settings));
      setConnectionStatus('success');
      setStatusMessage('Connection successful!');
    } catch (error) {
      setConnectionStatus('error');
      setStatusMessage(`Connection failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>Connection Settings</h2>
        </ModalHeader>
        <ModalContent>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Host</Label>
              <Input
                type="text"
                value={settings.host}
                onChange={(e) =>
                  setSettings({ ...settings, host: e.target.value })
                }
                placeholder="localhost"
              />
            </FormGroup>
            <FormGroup>
              <Label>Port</Label>
              <Input
                type="number"
                value={settings.port}
                onChange={(e) =>
                  setSettings({ ...settings, port: parseInt(e.target.value, 10) })
                }
                placeholder="9091"
              />
            </FormGroup>
            <FormGroup>
              <Label>Username (optional)</Label>
              <Input
                type="text"
                value={settings.username}
                onChange={(e) =>
                  setSettings({ ...settings, username: e.target.value })
                }
              />
            </FormGroup>
            <FormGroup>
              <Label>Password (optional)</Label>
              <Input
                type="password"
                value={settings.password}
                onChange={(e) =>
                  setSettings({ ...settings, password: e.target.value })
                }
              />
            </FormGroup>

            <StatusMessage status={connectionStatus}>
              {statusMessage}
            </StatusMessage>

            <ButtonGroup>
              <Button type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleTestConnection}
                disabled={isTestingConnection}
              >
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
              <Button type="submit">Save</Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};