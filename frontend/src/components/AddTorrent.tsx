import { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';

interface AddTorrentProps {
  onAdd: (url: string) => void;
  onClose: () => void;
}

const Modal = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 500px;
  z-index: 1000;
`;

const ModalHeader = styled.div`
  background: #1a1a1a;
  padding: 12px 16px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  -webkit-app-region: drag;
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
  -webkit-app-region: no-drag;
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

const Input = styled.input`
  padding: 8px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;

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

export const AddTorrent: React.FC<AddTorrentProps> = ({ onAdd, onClose }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(url.trim());
      onClose();
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>Add Torrent</h2>
        </ModalHeader>
        <ModalContent>
          <Form onSubmit={handleSubmit}>
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter torrent URL or magnet link"
              autoFocus
            />
            <ButtonGroup>
              <Button type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!url.trim()}>
                Add
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};