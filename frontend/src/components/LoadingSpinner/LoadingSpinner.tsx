import React from 'react';
import styles from './LoadingSpinner.module.css';

/**
 * Пропсы компонента LoadingSpinner
 */
export interface LoadingSpinnerProps {
  /** Размер спиннера: 'small' (16px), 'medium' (24px) или 'large' (32px) */
  size?: 'small' | 'medium' | 'large';
  /** Дополнительные CSS классы */
  className?: string;
}

/**
 * Компонент для отображения индикатора загрузки
 * 
 * @example
 * // Спиннер среднего размера
 * <LoadingSpinner />
 * 
 * @example
 * // Маленький спиннер
 * <LoadingSpinner size="small" />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  className = '',
}) => {
  return (
    <div 
      className={`${styles.spinner} ${className}`}
      data-testid="loading-spinner"
    >
      <svg
        className={`${styles.spinnerSvg} ${styles[size]}`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        data-testid="loading-spinner-svg"
      >
        <path
          d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};