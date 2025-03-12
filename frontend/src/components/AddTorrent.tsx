import React, { useState, useRef } from "react";
import styled from "@emotion/styled";
import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface AddTorrentProps {
  onAdd: (url: string) => void;
  onAddFile: (base64Content: string) => void;
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

const FileInputWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  input[type="file"] {
    display: none;
  }
`;

export const AddTorrent: React.FC<AddTorrentProps> = ({
  onAdd,
  onAddFile,
  onClose,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [url, setUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAdd(url.trim());
      onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = reader.result as string;
        // Удаляем префикс "data:application/x-bittorrent;base64,"
        const base64Data = base64Content.split(",")[1];
        onAddFile(base64Data);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLocalizationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>{t("add.title")}</h2>
        </ModalHeader>
        <ModalContent>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>{t("add.url")}</Label>
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="magnet:?xt=urn:btih:..."
              />
            </FormGroup>
            <FormGroup>
              <Label>{t("add.file")}</Label>
              <FileInputWrapper>
                <Input
                  type="text"
                  value={fileInputRef.current?.files?.[0]?.name ?? ""}
                  readOnly
                  placeholder={t("add.browse")}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("add.browse")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".torrent"
                  onChange={handleFileChange}
                />
              </FileInputWrapper>
            </FormGroup>
            <ButtonGroup>
              <Button type="button" onClick={onClose}>
                {t("add.cancel")}
              </Button>
              <Button type="submit" disabled={!url.trim()}>
                {t("add.add")}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </>
  );
};
