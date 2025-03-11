import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Button } from './Button';
import {
  XMarkIcon,
  LinkIcon,
  DocumentIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface AddTorrentProps {
  onAdd: (url: string) => void
  onAddFile: (filepath: string) => void
  onClose: () => void
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
`

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
`

const ModalContent = styled.div`
  padding: 24px;
  -webkit-app-region: no-drag;
`

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

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
`

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #e1e1e1;
  margin-bottom: 16px;
`

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 20px;
  background: ${props => props.active ? '#f5f5f5' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#3498db' : 'transparent'};
  cursor: pointer;
  font-size: 14px;
  color: ${props => props.active ? '#2c3e50' : '#95a5a6'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    color: #2c3e50;
    background: ${props => props.active ? '#f5f5f5' : '#f8f9fa'};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

const FileUploadArea = styled.div`
  border: 2px dashed #bdc3c7;
  border-radius: 4px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #3498db;
    background-color: #f7f9fc;
  }

  svg {
    width: 24px;
    height: 24px;
    color: #95a5a6;
    margin-bottom: 8px;
  }

  p {
    margin: 8px 0;
    color: #7f8c8d;
  }
`

const FileInput = styled.input`
  display: none;
`

const FileName = styled.div`
  margin-top: 12px;
  font-size: 14px;
  color: #2c3e50;
  word-break: break-all;
`

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`

type TabType = 'url' | 'file'

export const AddTorrent: React.FC<AddTorrentProps> = ({
  onAdd,
  onAddFile,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('url')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = React.createRef<HTMLInputElement>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (activeTab === 'url' && url.trim()) {
      onAdd(url.trim())
      onClose()
    } else if (activeTab === 'file' && file) {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        onAddFile(base64.split(',')[1])
        onClose()
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.torrent')) {
        setFile(droppedFile)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <Overlay onClick={onClose} />
      <Modal>
        <ModalHeader>
          <h2>Add Torrent</h2>
          <Button 
            variant="icon" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <XMarkIcon />
          </Button>
        </ModalHeader>
        <ModalContent>
          <Form onSubmit={handleSubmit}>
            <Tabs>
              <Tab 
                active={activeTab === 'url'} 
                onClick={() => setActiveTab('url')}
                type="button"
              >
                <LinkIcon />
                <span>URL / Magnet</span>
              </Tab>
              <Tab 
                active={activeTab === 'file'} 
                onClick={() => setActiveTab('file')}
                type="button"
              >
                <DocumentIcon />
                <span>Torrent File</span>
              </Tab>
            </Tabs>

            {activeTab === 'url' ? (
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter torrent URL or magnet link"
                autoFocus
              />
            ) : (
              <>
                <FileUploadArea 
                  onClick={handleFileClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <ArrowUpTrayIcon />
                  <p>Click or drop .torrent file here</p>
                  {file && <FileName>{file.name}</FileName>}
                </FileUploadArea>
                <FileInput 
                  type="file" 
                  ref={fileInputRef}
                  accept=".torrent"
                  onChange={handleFileChange} 
                />
              </>
            )}
            
            <ButtonGroup>
              <Button type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={(activeTab === 'url' && !url.trim()) || (activeTab === 'file' && !file)}
              >
                Add
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </>
  )
}