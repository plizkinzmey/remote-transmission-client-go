import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Свойства компонента Portal
 */
export interface PortalProps {
  /** Элемент, в который будет портироваться контент. По умолчанию document.body */
  container?: HTMLElement;
  /** Дочерние элементы для рендеринга в портале */
  children: React.ReactNode;
  /** Идентификатор для тестирования */
  testId?: string;
}

/**
 * Компонент Portal для рендеринга контента вне основного DOM-дерева.
 * 
 * @example
 * // Рендеринг в document.body
 * <Portal>
 *   <div>Контент в портале</div>
 * </Portal>
 * 
 * @example
 * // Рендеринг в указанный контейнер
 * <Portal container={someElement}>
 *   <div>Контент в кастомном контейнере</div>
 * </Portal>
 */
export const Portal = ({ container, children, testId }: PortalProps): React.ReactPortal | null => {
  // Используем useRef для хранения контейнера
  const defaultContainer = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Проверяем доступность DOM
    if (typeof document === 'undefined') {
      console.error('Portal requires a DOM environment');
      return;
    }

    // Устанавливаем defaultContainer только если он еще не установлен
    if (!defaultContainer.current) {
      defaultContainer.current = document.body;
    }

    return () => {
      // Очистка не требуется для createPortal, React сам очищает портал
      defaultContainer.current = null;
    };
  }, []);

  // Если DOM недоступен, возвращаем null
  if (typeof document === 'undefined') {
    return null;
  }

  // Используем предоставленный контейнер или document.body
  const targetContainer = container || defaultContainer.current || document.body;

  return createPortal(
    <div data-testid={testId}>{children}</div>,
    targetContainer
  );
};