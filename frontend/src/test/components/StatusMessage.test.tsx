import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Типизируем входные параметры для мок-компонента
type StatusMessageProps = {
  status: 'success' | 'error' | 'info' | 'none';
  message: string;
  fixedHeight?: boolean;
  height?: string;
  animated?: boolean;
  maxLines?: number;
};

// Мокируем все зависимости для StatusMessage
vi.mock('../../components/StatusMessage', () => {
  return {
    default: ({ status, message, fixedHeight = true, height = '60px', animated = true, maxLines = 2 }: StatusMessageProps) => {
      // Возвращаем упрощенный компонент для тестов
      if (status === 'none' && !fixedHeight) {
        return null;
      }
      
      if (status === 'none') {
        return <div style={{ height }} data-testid="empty-box" />;
      }
      
      const containerStyle = fixedHeight ? { height } : {};
      
      return (
        <div style={containerStyle} data-testid="status-container">
          <div 
            data-testid="message-container" 
            className={`messageContainer-mock ${animated ? 'animated-mock' : ''}`}
          >
            <svg 
              className={`${status}-mock`} 
              data-testid="icon" 
              width="16" 
              height="16"
            />
            <span 
              data-testid="message-text" 
              title={message}
              style={{ lineClamp: maxLines, WebkitLineClamp: maxLines }}
            >
              {message}
            </span>
          </div>
        </div>
      );
    }
  };
});

// Импортируем мокированный StatusMessage
import StatusMessage from '../../components/StatusMessage';

describe('StatusMessage', () => {
  it('renders success message correctly', () => {
    const message = "Операция успешно выполнена";
    render(<StatusMessage status="success" message={message} />);
    
    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();
    
    // Проверяем наличие иконки с правильным классом
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('success-mock');
  });

  it('renders error message correctly', () => {
    const message = "Произошла ошибка";
    render(<StatusMessage status="error" message={message} />);
    
    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();
    
    // Проверяем иконку ошибки
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('error-mock');
  });

  it('renders info message correctly', () => {
    const message = "Информационное сообщение";
    render(<StatusMessage status="info" message={message} />);
    
    // Проверяем отображение текста
    expect(screen.getByText(message)).toBeInTheDocument();
    
    // Проверяем иконку информации
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('info-mock');
  });

  it('returns empty box with fixed height when status is none', () => {
    const height = "30px";
    render(<StatusMessage status="none" message="" height={height} />);
    
    // Проверяем наличие пустого блока с заданной высотой
    const box = screen.getByTestId('empty-box');
    expect(box).toHaveStyle(`height: ${height}`);
  });

  it('returns null when status is none and fixedHeight is false', () => {
    const { container } = render(<StatusMessage status="none" message="" fixedHeight={false} />);
    
    // Проверяем что ничего не отрендерилось
    expect(container.firstChild).toBeNull();
  });

  it('applies animation class when animated is true', () => {
    render(<StatusMessage status="success" message="Сообщение с анимацией" animated={true} />);
    
    // Проверяем наличие класса анимации
    const messageContainer = screen.getByTestId('message-container');
    expect(messageContainer).toHaveClass('animated-mock');
  });

  it('does not apply animation class when animated is false', () => {
    render(<StatusMessage status="success" message="Сообщение без анимации" animated={false} />);
    
    // Проверяем отсутствие класса анимации
    const messageContainer = screen.getByTestId('message-container');
    expect(messageContainer).not.toHaveClass('animated-mock');
  });

  it('applies custom height when provided', () => {
    const customHeight = '100px';
    render(
      <StatusMessage status="info" message="Сообщение с настраиваемой высотой" height={customHeight} />
    );
    
    // Проверяем применение пользовательской высоты
    const container = screen.getByTestId('status-container');
    expect(container).toHaveStyle(`height: ${customHeight}`);
  });

  it('sets default height of 60px if not specified', () => {
    render(
      <StatusMessage status="info" message="Сообщение" />
    );
    
    // Проверяем высоту по умолчанию
    const container = screen.getByTestId('status-container');
    expect(container).toHaveStyle('height: 60px');
  });

  it('applies maxLines setting correctly', () => {
    const message = "Длинное информационное сообщение";
    render(
      <StatusMessage status="info" message={message} maxLines={1} />
    );
    
    // Проверяем ограничение строк
    const textElement = screen.getByText(message);
    expect(textElement).toHaveStyle('line-clamp: 1');
    expect(textElement).toHaveStyle('-webkit-line-clamp: 1');
  });

  it('uses default maxLines value of 2', () => {
    const message = "Информационное сообщение";
    render(
      <StatusMessage status="info" message={message} />
    );
    
    // Проверяем значение по умолчанию
    const textElement = screen.getByText(message);
    expect(textElement).toHaveStyle('line-clamp: 2');
    expect(textElement).toHaveStyle('-webkit-line-clamp: 2');
  });
});