import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Заменяем импорты Jest на Vitest
import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { ConnectionTab, ConnectionTabProps } from '../ConnectionTab';
import { ConnectionConfig } from '../../../../App'; // Adjust path if needed
import { TestConnection } from '../../../../../wailsjs/go/main/App'; // Mock this

// Mock Wails Go function using vi.fn()
vi.mock('../../../../../wailsjs/go/main/App', () => ({
  TestConnection: vi.fn(),
}));

// Mock useLocalization hook using vi.fn()
vi.mock('../../../../contexts/LocalizationContext', () => ({
  useLocalization: () => ({
    t: (key: string) => {
      // Provide simple translations for testing
      const translations: { [key: string]: string } = {
        'settings.host': 'Host',
        'settings.port': 'Port',
        'settings.username': 'Username',
        'settings.password': 'Password',
        'settings.testConnection': 'Test Connection',
        'settings.testing': 'Testing...',
        'settings.testSuccess': 'Connection successful!',
        'settings.testError': 'Connection failed.',
        'errors.connectionAuthRequired': 'Authentication required.',
        'errors.connectionRefused': 'Connection refused.',
        'errors.connectionTimeout': 'Connection timeout.',
        'settings.hostPlaceholder': 'e.g., localhost',
        'settings.portPlaceholder': 'e.g., 9091',
        'settings.usernamePlaceholder': 'Optional username',
        'settings.passwordPlaceholder': 'Optional password',
      };
      return translations[key] || key;
    },
  }),
}));

// Исправляем тип мока на MockedFunction<...> из vitest
const mockTestConnection = TestConnection as MockedFunction<typeof TestConnection>;

describe('ConnectionTab Component', () => {
  // Дополняем объект defaultSettings недостающими полями
  const defaultSettings: ConnectionConfig = {
    host: 'testhost',
    port: 9091,
    username: 'testuser',
    password: 'testpassword',
    // Добавляем недостающие поля с дефолтными значениями
    maxUploadRatio: 0, // Или другое подходящее значение по умолчанию
    slowSpeedLimit: 0, // Или другое подходящее значение по умолчанию
    slowSpeedUnit: 'KiB/s', // Исправлено с "KB/s" на "KiB/s"
  };

  // Используем vi.fn() для моков колбэков
  const mockOnSettingsChange = vi.fn();
  const mockOnConnectionTest = vi.fn();

  const renderComponent = (props: Partial<ConnectionTabProps> = {}) => {
    const combinedProps: ConnectionTabProps = {
      settings: defaultSettings,
      onSettingsChange: mockOnSettingsChange,
      onConnectionTest: mockOnConnectionTest,
      errors: {},
      ...props,
    };
    return render(<ConnectionTab {...combinedProps} />);
  };

  beforeEach(() => {
    // Reset mocks before each test
    mockOnSettingsChange.mockClear();
    mockOnConnectionTest.mockClear();
    mockTestConnection.mockClear();
  });

  // Заменяем test на it
  it('renders correctly with initial props', () => {
    renderComponent();

    expect(screen.getByTestId('connection-host-input')).toHaveValue(defaultSettings.host);
    expect(screen.getByTestId('connection-port-input')).toHaveValue(defaultSettings.port);
    expect(screen.getByTestId('connection-username-input')).toHaveValue(defaultSettings.username);
    expect(screen.getByTestId('connection-password-input')).toHaveValue(defaultSettings.password);
    expect(screen.getByTestId('connection-test-button')).toBeEnabled();
  });

  it('calls onSettingsChange when host input changes', () => {
    renderComponent();
    const hostInput = screen.getByTestId('connection-host-input');
    fireEvent.change(hostInput, { target: { value: 'newhost' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith({ host: 'newhost' });
  });

  it('calls onSettingsChange when port input changes', () => {
    renderComponent();
    const portInput = screen.getByTestId('connection-port-input');
    fireEvent.change(portInput, { target: { value: '8080' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith({ port: 8080 });
    fireEvent.change(portInput, { target: { value: '' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith({ port: undefined });
  });

  it('calls onSettingsChange when username input changes', () => {
    renderComponent();
    const usernameInput = screen.getByTestId('connection-username-input');
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith({ username: 'newuser' });
  });

  it('calls onSettingsChange when password input changes', () => {
    renderComponent();
    const passwordInput = screen.getByTestId('connection-password-input');
    fireEvent.change(passwordInput, { target: { value: 'newpass' } });
    expect(mockOnSettingsChange).toHaveBeenCalledWith({ password: 'newpass' });
  });

  it('displays validation errors', () => {
    const errors = { host: 'Host is required', port: 'Invalid port' };
    renderComponent({ errors });

    expect(screen.getByText('Host is required')).toBeInTheDocument();
    expect(screen.getByText('Invalid port')).toBeInTheDocument();
    // Check input color (might require specific setup or be brittle)
    // expect(screen.getByTestId('connection-host-input')).toHaveStyle('border-color: red'); // Example
  });

  it('disables test button when host is empty', () => {
    renderComponent({ settings: { ...defaultSettings, host: '' } });
    expect(screen.getByTestId('connection-test-button')).toBeDisabled();
  });

  it('calls TestConnection and onConnectionTest on successful test', async () => {
    mockTestConnection.mockResolvedValueOnce(undefined); // Simulate success
    renderComponent();

    const testButton = screen.getByTestId('connection-test-button');
    fireEvent.click(testButton);

    expect(testButton).toBeDisabled();
    expect(screen.getByText('Testing...')).toBeInTheDocument();
    expect(mockTestConnection).toHaveBeenCalledWith(JSON.stringify(defaultSettings));

    await waitFor(() => {
      expect(mockOnConnectionTest).toHaveBeenCalledWith(true);
    });

    expect(testButton).toBeEnabled();
    expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
    expect(screen.getByText('Test Connection')).toBeInTheDocument(); // Button text resets
  });

  it('calls TestConnection and onConnectionTest on failed test (generic error)', async () => {
    const error = new Error('Some generic network error');
    mockTestConnection.mockRejectedValueOnce(error); // Simulate failure
    renderComponent();

    const testButton = screen.getByTestId('connection-test-button');
    fireEvent.click(testButton);

    expect(testButton).toBeDisabled();
    expect(screen.getByText('Testing...')).toBeInTheDocument();
    expect(mockTestConnection).toHaveBeenCalledWith(JSON.stringify(defaultSettings));

    await waitFor(() => {
      expect(mockOnConnectionTest).toHaveBeenCalledWith(false, 'Connection failed.'); // Uses default error message
    });

    expect(testButton).toBeEnabled();
    expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
  });

  it('calls TestConnection and onConnectionTest on failed test (auth error)', async () => {
    const error = new Error('errors.connectionAuthRequired'); // Simulate specific error
    mockTestConnection.mockRejectedValueOnce(error);
    renderComponent();

    const testButton = screen.getByTestId('connection-test-button');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockOnConnectionTest).toHaveBeenCalledWith(false, 'Authentication required.'); // Uses specific error message
    });
    expect(testButton).toBeEnabled();
  });

  it('calls TestConnection and onConnectionTest on failed test (refused error)', async () => {
    const error = new Error('connection refused'); // Simulate specific error
    mockTestConnection.mockRejectedValueOnce(error);
    renderComponent();

    const testButton = screen.getByTestId('connection-test-button');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockOnConnectionTest).toHaveBeenCalledWith(false, 'Connection refused.'); // Uses specific error message
    });
    expect(testButton).toBeEnabled();
  });

  it('calls TestConnection and onConnectionTest on failed test (timeout error)', async () => {
    const error = new Error('some timeout error'); // Simulate specific error
    mockTestConnection.mockRejectedValueOnce(error);
    renderComponent();

    const testButton = screen.getByTestId('connection-test-button');
    fireEvent.click(testButton);

    await waitFor(() => {
      expect(mockOnConnectionTest).toHaveBeenCalledWith(false, 'Connection timeout.'); // Uses specific error message
    });
    expect(testButton).toBeEnabled();
  });

  it('resets connection status via onConnectionTest when settings change', () => {
    renderComponent();
    // Simulate a setting change after initial render
    const hostInput = screen.getByTestId('connection-host-input');
    fireEvent.change(hostInput, { target: { value: 'anotherhost' } });

    // The useEffect within useConnectionTest should call resetStatus, which calls onConnectionTest(false)
    // It might be called multiple times due to initial render + change
    expect(mockOnConnectionTest).toHaveBeenCalledWith(false);
  });

});
