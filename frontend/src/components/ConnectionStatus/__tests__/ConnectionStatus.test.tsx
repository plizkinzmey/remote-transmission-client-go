import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';
import styles from '../ConnectionStatus.module.css';

// Мокаем локализацию
vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
    locale: "en",
    setLocale: vi.fn()
  })
}));

describe('ConnectionStatus', () => {
  it('отображается при попытке переподключения', () => {
    render(<ConnectionStatus isReconnecting={true} />);
    
    expect(screen.getByTestId('connection-status-container')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status-message')).toBeInTheDocument();
    expect(screen.getByText('errors.timeoutExplanation')).toBeInTheDocument();
  });

  it('не отображается когда переподключение не требуется', () => {
    render(<ConnectionStatus isReconnecting={false} />);
    
    expect(screen.queryByTestId('connection-status-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('connection-status-message')).not.toBeInTheDocument();
  });

  it('применяет правильные стили', () => {
    render(<ConnectionStatus isReconnecting={true} />);
    
    const container = screen.getByTestId('connection-status-container');
    const message = screen.getByTestId('connection-status-message');
    
    expect(container).toHaveClass(styles.connectionStatus);
    expect(message).toHaveClass(styles.message);
  });
});