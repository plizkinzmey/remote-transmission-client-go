import styled from '@emotion/styled';
import { Button } from './Button';

interface TorrentItemProps {
  id: number;
  name: string;
  status: string;
  progress: number;
  onRemove: (id: number) => void;
}

const Container = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  -webkit-app-region: no-drag;
`;

const Info = styled.div`
  flex: 1;
  min-width: 0; // Prevent text overflow
`;

const Name = styled.h3`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Status = styled.span<{ status: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  background-color: ${({ status }) => {
    switch (status) {
      case 'downloading':
        return '#3498db';
      case 'seeding':
        return '#2ecc71';
      case 'stopped':
        return '#95a5a6';
      case 'completed':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  }};
  color: white;
`;

const Progress = styled.div`
  width: 100%;
  height: 4px;
  background-color: #ecf0f1;
  border-radius: 2px;
  margin-top: 8px;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: ${({ progress }) => progress}%;
  height: 100%;
  background-color: #3498db;
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 16px;
`;

const StyledButton = styled(Button)`
  padding: 6px 12px;
  font-size: 12px;
`;

export const TorrentItem: React.FC<TorrentItemProps> = ({
  id,
  name,
  status,
  progress,
  onRemove,
}) => {
  return (
    <Container>
      <Info>
        <Name title={name}>{name}</Name>
        <StatusContainer>
          <Status status={status}>{status}</Status>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {progress.toFixed(1)}%
          </span>
        </StatusContainer>
        <Progress>
          <ProgressBar progress={progress} />
        </Progress>
      </Info>
      <Actions>
        <StyledButton onClick={() => onRemove(id)}>Remove</StyledButton>
      </Actions>
    </Container>
  );
};