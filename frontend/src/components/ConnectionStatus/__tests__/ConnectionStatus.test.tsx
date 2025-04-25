import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionStatus } from '../ConnectionStatus';
import styles from '../ConnectionStatus.module.css';

// Мокаем локализацию
vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => key, // Простая заглушка для t
    // Добавляем недостающие свойства из типа LocalizationContextType
    currentLanguage: "en",
    isLoading: false,
    availableLanguages: [],
    setLanguage: vi.fn(),
  })
}));

describe('ConnectionStatus', () => {
  it('отображается при попытке переподключения', () => {
    render(<ConnectionStatus isReconnecting={true} error={null} />);

    expect(screen.getByTestId('connection-status-container')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('connection-status-message')).toBeInTheDocument();
    expect(screen.getByText('errors.timeoutExplanation')).toBeInTheDocument();
  });

  it('отображается при ошибке без переподключения', () => {
    const errorMessage = 'errors.connectionFailed';
    render(<ConnectionStatus isReconnecting={false} error={errorMessage} />);

    expect(screen.getByTestId('connection-status-container')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('connection-status-message')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByTestId('connection-status-container')).toHaveClass(styles.error);
  });

  it('не отображается когда переподключение не требуется и нет ошибки', () => {
    render(<ConnectionStatus isReconnecting={false} error={null} />);

    expect(screen.queryByTestId('connection-status-container')).not.toBeInTheDocument();
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('connection-status-message')).not.toBeInTheDocument();
  });

  it('применяет правильные стили при переподключении', () => {
    render(<ConnectionStatus isReconnecting={true} error={null} />);

    const container = screen.getByTestId('connection-status-container');
    const message = screen.getByTestId('connection-status-message');

    expect(container).toHaveClass(styles.connectionStatus);
    expect(container).not.toHaveClass(styles.error);
    expect(message).toHaveClass(styles.message);
  });

  it('применяет правильные стили при ошибке', () => {
    const errorMessage = 'errors.genericError';
    render(<ConnectionStatus isReconnecting={false} error={errorMessage} />);

    const container = screen.getByTestId('connection-status-container');
    const message = screen.getByTestId('connection-status-message');

    expect(container).toHaveClass(styles.connectionStatus);
    expect(container).toHaveClass(styles.error);
    expect(message).toHaveClass(styles.message);
  });

  it('отображается при ошибке во время переподключения', () => {
    const errorMessage = 'errors.connectionFailedDuringReconnect';
    render(<ConnectionStatus isReconnecting={true} error={errorMessage} />);

    // Проверяем наличие контейнера
    const container = screen.getByTestId('connection-status-container');
    expect(container).toBeInTheDocument();

    // Проверяем наличие спиннера (т.к. isReconnecting = true)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    // Проверяем наличие сообщения об ошибке (т.к. error имеет приоритет)
    const messageElement = screen.getByTestId('connection-status-message');
    expect(messageElement).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Должна отображаться ошибка, а не сообщение о реконнекте

    // Проверяем наличие класса ошибки (т.к. error не null)
    expect(container).toHaveClass(styles.error);
  });
});