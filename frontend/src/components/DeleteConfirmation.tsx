import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';

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

const Message = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #2c3e50;
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
`;

const DeleteButton = styled(Button)`
  background-color: #e74c3c;
  &:hover {
    background-color: #c0392b;
  }
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
        </ModalHeader>
        <ModalContent>
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
            <Button onClick={onCancel}>Cancel</Button>
            <DeleteButton onClick={() => onConfirm(deleteData)}>
              Delete
            </DeleteButton>
          </ButtonGroup>
        </ModalContent>
      </Modal>
    </>
  );
};