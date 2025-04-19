import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig, SaveAllSettings } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App';
import { ConnectionTab } from '@components/Settings/ConnectionTab';
import { useConnectionTester } from '@components/Settings/hooks/useConnectionTester';
import { useSettingsSaver } from '@components/Settings/hooks/useSettingsSaver';

// --- Mocks ---
vi.mock('@components/Settings/ConnectionTab', () => ({
    ConnectionTab: vi.fn(({ settings, onSettingsChange, onConnectionTest }) => (
        <div data-testid="connection-tab-mock">
            <input
                data-testid="connection-host-input"
                value={settings.host}
                onChange={(e) => onSettingsChange({ host: e.target.value })}
            />
            <button data-testid="connection-test-button-success" onClick={() => onConnectionTest(true)}>Test Success</button>
        </div>
    )),
}));
vi.mock('@components/LanguageSelector', () => ({
    LanguageSelector: vi.fn(() => <div data-testid="language-selector-mock">Language Selector Mock</div>),
}));
vi.mock('@components/StatusMessage', () => ({
    default: vi.fn(({ status, message, 'data-testid': dataTestId }) => (
        <div data-testid={dataTestId || 'settings-status-message'} data-status={status}>
            {message}
        </div>
    )),
}));
vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>),
}));

// Hoist mocks for hooks
const { mockHandleConnectionTestResult, mockResetConnectionTest } = vi.hoisted(() => ({
    mockHandleConnectionTestResult: vi.fn(),
    mockResetConnectionTest: vi.fn(),
}));

const { mockSaverHandleSave, mockSaverResetChanges, mockUseSettingsSaver } = vi.hoisted(() => {
    const mockSaverHandleSave = vi.fn();
    const mockSaverResetChanges = vi.fn();
    type SaverProps = Parameters<typeof useSettingsSaver>[0];
    const mockUseSettingsSaver = vi.fn<
        (props: SaverProps) => ReturnType<typeof useSettingsSaver>
    >(({ onSaveSuccess, onSaveError, onConnectionInitNeeded, isFirstStart }) => {
        mockSaverHandleSave.mockImplementation(async () => {
            if (isFirstStart && onConnectionInitNeeded) {
                try {
                    const success = await onConnectionInitNeeded();
                    if (success && onSaveSuccess) onSaveSuccess();
                } catch (e) {
                    if (onSaveError) {
                        if (e instanceof Error) {
                            onSaveError(e);
                        } else {
                            onSaveError(String(e));
                        }
                    }
                }
            } else if (onSaveSuccess) {
                onSaveSuccess();
            }
        });
        return { isSaving: false, handleSave: mockSaverHandleSave, resetChanges: mockSaverResetChanges };
    });
    return { mockSaverHandleSave, mockSaverResetChanges, mockUseSettingsSaver };
});

vi.mock('@components/Settings/hooks/useConnectionTester', () => ({
    useConnectionTester: vi.fn(() => ({
        isConnectionValid: false,
        connectionErrorMessage: null,
        handleConnectionTestResult: mockHandleConnectionTestResult,
        resetConnectionTest: mockResetConnectionTest,
    })),
}));
vi.mock('@components/Settings/hooks/useSettingsSaver', () => ({
    useSettingsSaver: mockUseSettingsSaver
}));
vi.mock('@wailsjs/go/main/App', () => ({
    LoadConfig: vi.fn(),
    SaveAllSettings: vi.fn(),
}));

// Default props
const defaultProps: SettingsProps = {
    onSave: vi.fn().mockResolvedValue(true) as unknown as (settings: ConnectionConfig) => Promise<boolean>,
    onClose: vi.fn() as unknown as () => void,
    isFirstStart: true,
};

// Helper
const renderSettings = (props: Partial<SettingsProps> = {}) => {
    return render(<Settings {...defaultProps} {...props} isFirstStart={true} />);
};

// --- Tests ---
describe('Settings Component - First Start Mode - Save Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (defaultProps.onSave as ReturnType<typeof vi.fn>).mockClear().mockResolvedValue(true);
        (defaultProps.onClose as ReturnType<typeof vi.fn>).mockClear();
        mockHandleConnectionTestResult.mockClear();
        mockResetConnectionTest.mockClear();
        mockUseSettingsSaver.mockClear();
        mockSaverHandleSave.mockClear();
        (ConnectionTab as ReturnType<typeof vi.fn>).mockClear();
        (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
            isConnectionValid: false,
            connectionErrorMessage: null,
            handleConnectionTestResult: mockHandleConnectionTestResult,
            resetConnectionTest: mockResetConnectionTest,
        }));
    });

    it('enables Save button after successful connection test', async () => {
        // Mock connection tester to become valid on success
        mockHandleConnectionTestResult.mockImplementation((success: boolean) => {
            if (success) {
                (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                    isConnectionValid: true, // Now valid
                    connectionErrorMessage: null,
                    handleConnectionTestResult: mockHandleConnectionTestResult,
                    resetConnectionTest: mockResetConnectionTest,
                }));
            }
        });
        const { rerender } = renderSettings();
        expect(screen.getByTestId('settings-save-button')).toBeDisabled();

        // Simulate successful test
        fireEvent.click(screen.getByTestId('connection-test-button-success'));
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} isFirstStart={true} />); // Rerender to reflect hook update

        // Button is enabled
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());
    });

    it('calls onSave and onClose when saving after successful test', async () => {
        // Mock validation success
        mockHandleConnectionTestResult.mockImplementation((success: boolean) => {
            if (success) {
                (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                    isConnectionValid: true,
                    connectionErrorMessage: null,
                    handleConnectionTestResult: mockHandleConnectionTestResult,
                    resetConnectionTest: mockResetConnectionTest,
                }));
            }
        });
        const { rerender } = renderSettings();

        // Setup test
        fireEvent.change(screen.getByTestId('connection-host-input'), { target: { value: 'good-host' } });
        fireEvent.click(screen.getByTestId('connection-test-button-success'));
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} isFirstStart={true} />);
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());

        // Click save
        fireEvent.click(screen.getByTestId('settings-save-button'));

        // Run checks
        await waitFor(() => expect(mockSaverHandleSave).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({ host: 'good-host' })));
        await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalledTimes(1));
    });

    it('handles error during initial save (onSave rejects)', async () => {
        const mockError = new Error('Init Failed');
        const onSaveMock = vi.fn().mockRejectedValue(mockError);
        let currentErrorMessage: string | null = null;

        mockHandleConnectionTestResult.mockImplementation((success: boolean, message?: string) => {
            const isValid = success;
            currentErrorMessage = isValid ? null : message || null;
            (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                isConnectionValid: isValid,
                connectionErrorMessage: currentErrorMessage,
                handleConnectionTestResult: mockHandleConnectionTestResult,
                resetConnectionTest: mockResetConnectionTest,
            }));
        });

        const { rerender } = renderSettings({ onSave: onSaveMock });

        fireEvent.change(screen.getByTestId('connection-host-input'), { target: { value: 'fail-host' } });
        fireEvent.click(screen.getByTestId('connection-test-button-success'));

        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());

        fireEvent.click(screen.getByTestId('settings-save-button'));

        await waitFor(() => expect(mockSaverHandleSave).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(onSaveMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(onSaveMock).toHaveBeenCalledWith(
            expect.objectContaining({ host: 'fail-host' })
        ));

        await waitFor(() => {
            expect(mockHandleConnectionTestResult).toHaveBeenCalledTimes(2);
        });
        expect(mockHandleConnectionTestResult).toHaveBeenLastCalledWith(
            false,
            'errors.failedToInitializeConnection'
        );

        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'error');
            expect(statusMessage.textContent).toBe('errors.failedToInitializeConnection');
        });

        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles false return from onSave without exception', async () => {
        const onSaveMock = vi.fn().mockResolvedValue(false);
        let currentErrorMessage: string | null = null;

        // Mock connection tester
        mockHandleConnectionTestResult.mockImplementation((success: boolean, message?: string) => {
            const isValid = success;
            currentErrorMessage = isValid ? null : message || null;
            (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                isConnectionValid: isValid,
                connectionErrorMessage: currentErrorMessage,
                handleConnectionTestResult: mockHandleConnectionTestResult,
                resetConnectionTest: mockResetConnectionTest,
            }));
        });

        const { rerender } = renderSettings({ onSave: onSaveMock });

        // Enable save button
        fireEvent.change(screen.getByTestId('connection-host-input'), { target: { value: 'test-host' } });
        fireEvent.click(screen.getByTestId('connection-test-button-success'));
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());

        // Click Save
        fireEvent.click(screen.getByTestId('settings-save-button'));

        // Check that onSave was called
        await waitFor(() => expect(onSaveMock).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(onSaveMock).toHaveBeenCalledWith(
            expect.objectContaining({ host: 'test-host' })
        ));

        // Check that error handling was triggered
        await waitFor(() => {
            expect(mockHandleConnectionTestResult).toHaveBeenLastCalledWith(
                false,
                'errors.failedToInitializeConnection'
            );
        });

        // Check UI shows error
        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'error');
            expect(statusMessage.textContent).toBe('errors.failedToInitializeConnection');
        });

        // Verify onClose was not called
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles non-Error rejection from onSave', async () => {
        const nonErrorValue = 'custom error string';
        const onSaveMock = vi.fn().mockRejectedValue(nonErrorValue);
        let currentErrorMessage: string | null = null;

        mockHandleConnectionTestResult.mockImplementation((success: boolean, message?: string) => {
            const isValid = success;
            currentErrorMessage = isValid ? null : message || null;
            (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                isConnectionValid: isValid,
                connectionErrorMessage: currentErrorMessage,
                handleConnectionTestResult: mockHandleConnectionTestResult,
                resetConnectionTest: mockResetConnectionTest,
            }));
        });

        const { rerender } = renderSettings({ onSave: onSaveMock });

        fireEvent.change(screen.getByTestId('connection-host-input'), { target: { value: 'fail-host' } });
        fireEvent.click(screen.getByTestId('connection-test-button-success'));
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());

        fireEvent.click(screen.getByTestId('settings-save-button'));

        await waitFor(() => expect(mockSaverHandleSave).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(onSaveMock).toHaveBeenCalledTimes(1));

        await waitFor(() => {
            expect(mockHandleConnectionTestResult).toHaveBeenCalledTimes(2);
        });
        expect(mockHandleConnectionTestResult).toHaveBeenLastCalledWith(
            false,
            'errors.failedToInitializeConnection'
        );

        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'error');
            expect(statusMessage.textContent).toBe('errors.failedToInitializeConnection');
        });

        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
});
