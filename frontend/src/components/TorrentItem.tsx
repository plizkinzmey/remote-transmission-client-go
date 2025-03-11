import { useState } from 'react';
import { Button } from './Button';
import { DeleteConfirmation } from './DeleteConfirmation';
import styles from '../styles/TorrentItem.module.css';

interface TorrentItemProps {
  id: number;
  name: string;
  status: string;
  progress: number;
  onRemove: (id: number, deleteData: boolean) => void;
}

export const TorrentItem: React.FC<TorrentItemProps> = ({
  id,
  name,
  status,
  progress,
  onRemove,
}) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const getStatusClassName = (status: string) => {
    switch (status) {
      case 'downloading':
        return styles.statusDownloading;
      case 'seeding':
        return styles.statusSeeding;
      case 'completed':
        return styles.statusCompleted;
      default:
        return styles.statusStopped;
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.info}>
          <h3 className={styles.name} title={name}>
            {name}
          </h3>
          <div className={styles.statusContainer}>
            <span className={getStatusClassName(status)}>{status}</span>
            <span className={styles.progressText}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className={styles.progress}>
            <div 
              className={styles.progressBar} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <Button onClick={() => setShowDeleteConfirmation(true)}>Remove</Button>
        </div>
      </div>

      {showDeleteConfirmation && (
        <DeleteConfirmation
          torrentName={name}
          onConfirm={(deleteData) => {
            onRemove(id, deleteData);
            setShowDeleteConfirmation(false);
          }}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
    </>
  );
};