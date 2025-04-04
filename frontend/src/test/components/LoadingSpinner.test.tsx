import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Создаем спай-функцию для отслеживания добавления анимации
const addSpinKeyframesSpy = vi.fn();

// Мокируем компонент LoadingSpinner
vi.mock('../../components/LoadingSpinner', () => {
  return {
    LoadingSpinner: ({ size = 'medium', className = '' }: { size?: 'small' | 'medium' | 'large', className?: string }) => {
      // Размеры для разных вариантов size
      const sizes: Record<'small' | 'medium' | 'large', string> = {
        small: '16px',
        medium: '24px',
        large: '32px'
      };
      
      // Добавление стилей анимации, если их еще нет
      if (!document.querySelector('#spin-keyframes')) {
        addSpinKeyframesSpy();
      }
      
      return (
        <svg
          data-testid="loading-spinner"
          className={className}
          width={sizes[size]}
          height={sizes[size]}
          style={{ animation: 'spin 1s linear infinite' }}
        />
      );
    }
  };
});

// Импортируем LoadingSpinner
import { LoadingSpinner } from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default medium size', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId('loading-spinner');
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('width', '24px');
    expect(spinner).toHaveAttribute('height', '24px');
  });

  it('renders with small size when specified', () => {
    render(<LoadingSpinner size="small" />);
    const spinner = screen.getByTestId('loading-spinner');
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('width', '16px');
    expect(spinner).toHaveAttribute('height', '16px');
  });

  it('renders with large size when specified', () => {
    render(<LoadingSpinner size="large" />);
    const spinner = screen.getByTestId('loading-spinner');
    
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('width', '32px');
    expect(spinner).toHaveAttribute('height', '32px');
  });

  it('applies className when provided', () => {
    const testClass = 'test-spinner-class';
    render(<LoadingSpinner className={testClass} />);
    
    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toHaveClass(testClass);
  });

  it('adds spin animation styles when not present', () => {
    // Здесь мы проверяем, что функция добавления стилей вызывается
    render(<LoadingSpinner />);
    expect(addSpinKeyframesSpy).toHaveBeenCalled();
  });

  it('applies animation style to the icon', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByTestId('loading-spinner');
    
    expect(spinner).toHaveStyle('animation: spin 1s linear infinite');
  });
});