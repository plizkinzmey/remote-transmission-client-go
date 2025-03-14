import React from "react";
import styled from "@emotion/styled";
import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { Portal } from "./Portal";

interface BulkDeleteConfirmationProps {
  count: number;
  onConfirm: (deleteData: boolean) => void;
  onCancel: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const Modal = styled.div`
  background: var(--card-background);
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--modal-shadow);
  width: 400px;
  max-width: 90%;
  color: var(--text-primary);
  position: relative;
  overflow: hidden; /* Предотвращаем выход контента за границы */
  animation: modalAppear 0.2s ease-out forwards;

  @keyframes modalAppear {
    from {
      transform: scale(0.95);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const Title = styled.h2`
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--text-primary);
  font-weight: 600;
`;

const Text = styled.p`
  margin: 0 0 16px 0;
  color: var(--text-secondary);
  word-break: break-word; /* Разрешаем перенос длинных слов */
  overflow-wrap: break-word;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

const OptionsContainer = styled.div`
  margin: 16px 0;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 4px;
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: var(--text-secondary);

  input {
    margin: 0;
    cursor: pointer;
    width: 16px;
    height: 16px;

    &:checked {
      accent-color: var(--error-color);
    }
  }
`;

export const BulkDeleteConfirmation: React.FC<BulkDeleteConfirmationProps> = ({
  count,
  onConfirm,
  onCancel,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [deleteData, setDeleteData] = React.useState(false);

  // Предотвращаем всплытие события клика для Modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Обработчик нажатия Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  if (isLocalizationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Portal>
      <Overlay onClick={onCancel}>
        <Modal onClick={handleModalClick}>
          <Title>{t("remove.title")}</Title>
          <Text>{t("remove.selectedConfirmation")}</Text>
          <Text>
            <strong>
              {t("torrents.selected", String(count), String(count))}
            </strong>
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
      </Overlay>
    </Portal>
  );
};
