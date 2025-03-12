import React from "react";
import styled from "@emotion/styled";
import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface DeleteConfirmationProps {
  torrentName: string;
  onConfirm: (deleteData: boolean) => void;
  onCancel: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

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

const Title = styled.h2`
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2c3e50;
`;

const Text = styled.p`
  margin: 0 0 16px 0;
  color: #34495e;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const OptionsContainer = styled.div`
  margin: 16px 0;
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: #34495e;

  input {
    margin: 0;
  }
`;

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  torrentName,
  onConfirm,
  onCancel,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [deleteData, setDeleteData] = React.useState(false);

  if (isLocalizationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Overlay onClick={onCancel} />
      <Modal>
        <Title>{t("remove.title")}</Title>
        <Text>{t("remove.confirmation")}</Text>
        <Text>
          <strong>{torrentName}</strong>
        </Text>
        <OptionsContainer>
          <Checkbox>
            <input
              type="checkbox"
              checked={deleteData}
              onChange={(e) => setDeleteData(e.target.checked)}
            />
            {t("remove.withData")}
          </Checkbox>
        </OptionsContainer>
        <ButtonGroup>
          <Button type="button" onClick={onCancel}>
            {t("remove.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => onConfirm(deleteData)}
          >
            {t("remove.confirm")}
          </Button>
        </ButtonGroup>
      </Modal>
    </>
  );
};
