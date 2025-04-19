// Tests for Settings component - Normal Mode - Connection Testing Logic
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App';

// Mock child components relevant to connection testing
vi.mock('@components/Settings/ConnectionTab', () => ({
    ConnectionTab: vi.fn(({ settings, onSettingsChange, onConnectionTest, errors }) => (
        <div data-testid="connection-tab-mock">
            Connection Tab Mock
            <input
                data-testid="connection-host-input"
                value={settings.host}
                onChange={(e) => onSettingsChange({ host: e.target.value })}
            />
            <button data-testid="connection-test-button-success" onClick={() => onConnectionTest(true)}>
                Test Success
            </button>
            <button data-testid="connection-test-button-fail" onClick={() => onConnectionTest(false, 'Connection error')}>
                Test Fail
            </button>
        </div>
    )),
}));

// Mock необходимые компоненты
vi.mock('@components/StatusMessage', () => ({
    default: vi.fn(({ status, message, 'data-testid': dataTestId }) => (
        <div data-testid={dataTestId || 'status-message-mock'} data-status={status}>
            {message}
        </div>
    )),
}));

const defaultProps: SettingsProps = {
    onSave: vi.fn().mockResolvedValue(true),
    onClose: vi.fn(),
    isFirstStart: false,
};

const renderSettings = (props: Partial<SettingsProps> = {}) => {
    return render(<Settings {...defaultProps} {...props} isFirstStart={false} />);
};

describe('Settings Component - Normal Mode - Connection Testing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
            host: 'test-host',
            port: 9091,
            username: '',
            password: '',
            maxUploadRatio: 2,
            slowSpeedLimit: 50,
            slowSpeedUnit: 'KiB/s'
        });
    });

    it('handles successful connection test', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Нажимаем кнопку успешного теста
        const testButton = screen.getByTestId('connection-test-button-success');
        fireEvent.click(testButton);

        // Проверяем сообщение об успехе
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'success');
        });
    });

    it('handles failed connection test', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Нажимаем кнопку неуспешного теста
        const testButton = screen.getByTestId('connection-test-button-fail');
        fireEvent.click(testButton);

        // Проверяем сообщение об ошибке
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'error');
            expect(statusMessage).toHaveTextContent('Connection error');
        });
    });

    it('resets connection status when host changes', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Сначала делаем успешный тест
        const testButton = screen.getByTestId('connection-test-button-success');
        fireEvent.click(testButton);

        // Проверяем успешный статус
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'success');
        });

        // Меняем хост
        const hostInput = screen.getByTestId('connection-host-input');
        fireEvent.change(hostInput, { target: { value: 'new-host' } });

        // Проверяем что статус сбросился
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'none');
        });
    });
});