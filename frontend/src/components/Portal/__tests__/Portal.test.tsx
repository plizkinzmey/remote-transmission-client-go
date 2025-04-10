import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { Portal } from '../Portal';
import * as ReactDOM from 'react-dom';

// Мокаем react-dom
vi.mock('react-dom', () => ({
  createPortal: vi.fn((children, container) => (
    <div data-testid="mocked-portal" data-container={container === document.body ? 'body' : 'custom'}>
      {children}
    </div>
  ))
}));

// Получаем типизированный mock для createPortal
const mockedCreatePortal = vi.mocked(ReactDOM.createPortal);

describe('Portal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('рендерит контент в document.body по умолчанию', async () => {
    const testContent = 'Test Content';
    await act(async () => {
      render(<Portal testId="test-portal">{testContent}</Portal>);
    });

    const portalContent = document.querySelector('[data-testid="test-portal"]');
    const mockedPortal = document.querySelector('[data-testid="mocked-portal"]');

    expect(portalContent).toBeInTheDocument();
    expect(portalContent?.textContent).toBe(testContent);
    expect(mockedPortal?.getAttribute('data-container')).toBe('body');
    expect(mockedCreatePortal).toHaveBeenCalledWith(
      expect.any(Object),
      document.body
    );
  });

  it('рендерит контент в указанный контейнер', async () => {
    const customContainer = document.createElement('div');
    document.body.appendChild(customContainer);

    const testContent = 'Custom Container Content';
    await act(async () => {
      render(
        <Portal container={customContainer} testId="custom-portal">
          {testContent}
        </Portal>
      );
    });

    const portalContent = document.querySelector('[data-testid="custom-portal"]');
    const mockedPortal = document.querySelector('[data-testid="mocked-portal"]');

    expect(portalContent).toBeInTheDocument();
    expect(portalContent?.textContent).toBe(testContent);
    expect(mockedPortal?.getAttribute('data-container')).toBe('custom');
    expect(mockedCreatePortal).toHaveBeenCalledWith(
      expect.any(Object),
      customContainer
    );

    document.body.removeChild(customContainer);
  });

  it('корректно обрабатывает изменения children', async () => {
    const { rerender } = render(
      <Portal testId="update-portal">Initial Content</Portal>
    );

    await act(async () => {
      rerender(<Portal testId="update-portal">Updated Content</Portal>);
    });

    const portalContent = document.querySelector('[data-testid="update-portal"]');
    expect(portalContent?.textContent).toBe('Updated Content');
  });

  it('удаляет контент при размонтировании', async () => {
    const { unmount } = render(
      <Portal testId="unmount-portal">Content to unmount</Portal>
    );

    const portalContent = document.querySelector('[data-testid="unmount-portal"]');
    expect(portalContent).toBeInTheDocument();

    await act(async () => {
      unmount();
    });

    expect(document.querySelector('[data-testid="unmount-portal"]')).not.toBeInTheDocument();
  });

  it('обрабатывает события с правильным всплытием', async () => {
    const handleClick = vi.fn();
    document.body.addEventListener('click', handleClick);

    await act(async () => {
      render(
        <Portal testId="event-portal">
          <button>Click me</button>
        </Portal>
      );
    });

    const button = document.querySelector('button');
    button?.click();

    expect(handleClick).toHaveBeenCalled();
    document.body.removeEventListener('click', handleClick);
  });

  it('правильно использует createPortal', async () => {
    const testContent = 'Portal Content';

    await act(async () => {
      render(<Portal testId="portal-test">{testContent}</Portal>);
    });

    expect(mockedCreatePortal).toHaveBeenCalled();

    const [children, targetContainer] = mockedCreatePortal.mock.calls[0] || [];

    if (React.isValidElement(children)) {
      expect(children.props['data-testid']).toBe('portal-test');
      expect(children.props.children).toBe(testContent);
    }

    expect(targetContainer).toBe(document.body);
  });
});