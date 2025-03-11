import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface DeleteConfirmationProps {
  torrentName: string;
  onConfirm: (deleteData: boolean) => void;
  onCancel: () => void;
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
  width: 400px;
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

const WarningIcon = styled(ExclamationTriangleIcon)`
  width: 32px;
  height: 32px;
  color: #e74c3c;
  margin-bottom: 16px;
`;

const Message = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #2c3e50;
  text-align: center;
`;

const DialogContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
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

const CheckboxContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  margin: 0;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #2c3e50;
  user-select: none;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
`;

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  torrentName,
  onConfirm,
  onCancel,
}) => {
  const [deleteData, setDeleteData] = useState(false);

  return (
    <>
      <Overlay onClick={onCancel} />
      <Modal>
        <ModalHeader>
          <h2>Delete Torrent</h2>
          <Button 
            variant="icon" 
            onClick={onCancel}
            aria-label="Close dialog"
          >
            <XMarkIcon />
          </Button>
        </ModalHeader>
        <DialogContent>
          <WarningIcon />
          <Message>
            Are you sure you want to delete torrent "{torrentName}"?
          </Message>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="deleteData"
              checked={deleteData}
              onChange={(e) => setDeleteData(e.target.checked)}
            />
            <CheckboxLabel htmlFor="deleteData">
              Also delete downloaded data
            </CheckboxLabel>
          </CheckboxContainer>
          <ButtonGroup>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={() => onConfirm(deleteData)}
              variant="danger"
            >
              <TrashIcon />
              Delete
            </Button>
          </ButtonGroup>
        </DialogContent>
      </Modal>
    </>
  );
};