import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';

interface SettingsProps {
  onSave: (settings: {
    host: string;
    port: number;
    username: string;
    password: string;
  }) => void;
  onClose: () => void;
  initialValues?: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 400px;
  z-index: 1000;
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

export const Settings: React.FC<SettingsProps> = ({
  onSave,
  onClose,
  initialValues = {
    host: 'http://localhost',
    port: 9091,
    username: '',
    password: '',
  },
}) => {
  const [settings, setSettings] = useState(initialValues);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <h2>Connection Settings</h2>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Host</Label>
            <Input
              type="text"
              value={settings.host}
              onChange={(e) =>
                setSettings({ ...settings, host: e.target.value })
              }
              placeholder="http://localhost"
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
          <ButtonGroup>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </ButtonGroup>
        </Form>
      </Modal>
    </>
  );
};