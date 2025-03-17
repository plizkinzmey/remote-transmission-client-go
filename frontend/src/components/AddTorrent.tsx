import React, { useState, useRef } from "react";
import styled from "@emotion/styled";
import { Button } from "./Button";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { FolderIcon } from "@heroicons/react/24/outline";

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
  background: var(--card-background);
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--modal-shadow);
  width: 500px;
  z-index: 1000;
  border: 1px solid var(--card-border);
`;

const ModalHeader = styled.div`
  background: var(--header-background);
  padding: 16px 20px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  user-select: none;
  h2 {
    color: var(--header-text);
    font-size: 16px;
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
  background: var(--modal-overlay);
  z-index: 999;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  background: var(--background-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color-light);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const FileInputArea = styled.div<{ isDragOver?: boolean }>`
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) =>
    props.isDragOver ? "var(--background-secondary)" : "transparent"};

  &:hover {
    border-color: var(--accent-color);
    background: var(--background-secondary);
  }
`;

const FileIcon = styled(FolderIcon)`
  width: 32px;
  height: 32px;
  color: var(--text-secondary);
  margin-bottom: 12px;
`;

const FileText = styled.div`
  color: var(--text-primary);
  font-size: 14px;
  margin-bottom: 4px;
`;

const FileSubText = styled.div`
  color: var(--text-secondary);
  font-size: 12px;
`;

const SelectedFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--background-secondary);
  border-radius: 6px;
  margin-top: 8px;

  span {
    color: var(--text-primary);
    font-size: 14px;
    flex: 1;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
`;

const Tab = styled.button<{ active?: boolean }>`
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.active ? "var(--accent-color)" : "transparent")};
  color: ${(props) =>
    props.active ? "var(--text-primary)" : "var(--text-secondary)"};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-primary);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

export const AddTorrent: React.FC<AddTorrentProps> = ({
  onAdd,
  onAddFile,
  onClose,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [url, setUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "url" && url.trim()) {
      onAdd(url.trim());
      onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64Content = reader.result as string;
      const base64Data = base64Content.split(",")[1];
      onAddFile(base64Data);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file?.name?.endsWith(".torrent")) {
      handleFile(file);
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>{t("add.title")}</h2>
        </ModalHeader>
        <ModalContent>
          {isLocalizationLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "24px",
              }}
            >
              <LoadingSpinner size="medium" />
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Tabs>
                <Tab
                  active={activeTab === "url"}
                  onClick={() => setActiveTab("url")}
                  type="button"
                >
                  {t("add.url")}
                </Tab>
                <Tab
                  active={activeTab === "file"}
                  onClick={() => setActiveTab("file")}
                  type="button"
                >
                  {t("add.file")}
                </Tab>
              </Tabs>

              {activeTab === "url" ? (
                <FormGroup>
                  <Input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="magnet:?xt=urn:btih:..."
                    autoFocus
                  />
                </FormGroup>
              ) : (
                <FormGroup>
                  <FileInputArea
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    isDragOver={isDragOver}
                  >
                    <FileIcon />
                    <FileText>{t("add.dropFile")}</FileText>
                    <FileSubText>{t("add.orClickToSelect")}</FileSubText>
                  </FileInputArea>
                  {selectedFileName && (
                    <SelectedFile>
                      <span>{selectedFileName}</span>
                    </SelectedFile>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".torrent"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </FormGroup>
              )}

              <ButtonGroup>
                <Button type="button" onClick={onClose}>
                  {t("add.cancel")}
                </Button>
                {activeTab === "url" && (
                  <Button
                    type="submit"
                    disabled={!url.trim()}
                    variant="default"
                  >
                    {t("add.add")}
                  </Button>
                )}
              </ButtonGroup>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
