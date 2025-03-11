import { useState } from 'react';
import { Button } from './Button';
import { DeleteConfirmation } from './DeleteConfirmation';
import styles from '../styles/TorrentItem.module.css';

interface TorrentItemProps {
  id: number;
  name: string;
  status: string;
  progress: number;
  selected: boolean;
  onSelect: (id: number) => void;
  onRemove: (id: number, deleteData: boolean) => void;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
}

export const TorrentItem: React.FC<TorrentItemProps> = ({
  id,
  name,
  status,
  progress,
  selected,
  onSelect,
  onRemove,
  onStart,
  onStop,
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

  const isRunning = status === 'downloading' || status === 'seeding';

  return (
    <>
      <div className={styles.container}>
        <label className={styles.checkbox}>
          <input 
            type="checkbox" 
            checked={selected}
            onChange={() => onSelect(id)}
            aria-label={`Select torrent ${name}`}
          />
        </label>
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
          <div className={styles.progressContainer}>
            <progress 
              className={styles.progress}
              value={progress} 
              max={100}
            />
            <div 
              className={styles.progressBar} 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className={styles.actions}>
          {isRunning ? (
            <Button 
              onClick={() => onStop(id)}
              aria-label={`Pause torrent ${name}`}
            >
              Pause
            </Button>
          ) : (
            <Button 
              onClick={() => onStart(id)}
              aria-label={`Start torrent ${name}`}
            >
              Start
            </Button>
          )}
          <Button 
            onClick={() => setShowDeleteConfirmation(true)}
            aria-label={`Remove torrent ${name}`}
          >
            Remove
          </Button>
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