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
    ConnectionTab: vi.fn(({ settings, onSettingsChange, onConnectionTest }) => ( // Removed errors prop for simplicity here
        <div data-testid="connection-tab-mock">
            <input
                data-testid="connection-host-input"
                value={settings.host}
                onChange={(e) => onSettingsChange({ host: e.target.value })}
            />
            {/* Simulate test trigger */}
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
                    // Error handling is done within onConnectionInitNeeded
                } catch (e) {
                    if (onSaveError) onSaveError("Unexpected error in mock saver");
                }
            } else if (onSaveSuccess) { // Non-first start simplified
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
    // Spy on console.error ONLY for the error test, restore afterwards
    let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null;

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
        // Reset connection tester state
        (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
            isConnectionValid: false,
            connectionErrorMessage: null,
            handleConnectionTestResult: mockHandleConnectionTestResult,
            resetConnectionTest: mockResetConnectionTest,
        }));
    });

    afterEach(() => {
        // Restore console.error if it was spied on
        consoleErrorSpy?.mockRestore();
        consoleErrorSpy = null;
    });

    // Test Save button disabled state
    it('enables Save button after successful connection test', async () => {
        // Arrange: Mock connection tester to become valid on success
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

        // Act: Simulate successful test
        fireEvent.click(screen.getByTestId('connection-test-button-success'));
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} isFirstStart={true} />); // Rerender to reflect hook update

        // Assert: Button is enabled
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());
    });

    // Test successful save
    it('calls onSave and onClose when saving after successful test', async () => {
        // Arrange: Mock connection tester to enable save
        mockHandleConnectionTestResult.mockImplementation((success: boolean) => {
            if (success) {
                (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                    isConnectionValid: true, connectionErrorMessage: null,
                    handleConnectionTestResult: mockHandleConnectionTestResult, resetConnectionTest: mockResetConnectionTest,
                }));
            }
        });
        const { rerender } = renderSettings(); // Uses defaultProps.onSave resolving true

        // Act: Enable save button
        fireEvent.change(screen.getByTestId('connection-host-input'), { target: { value: 'good-host' } });
        fireEvent.click(screen.getByTestId('connection-test-button-success'));
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} isFirstStart={true} />);
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());

        // Act: Click Save
        fireEvent.click(screen.getByTestId('settings-save-button'));

        // Assert
        await waitFor(() => expect(mockSaverHandleSave).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({ host: 'good-host' })));
        await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalledTimes(1)); // Check onClose
    });

    // Test error handling during save
    it('handles error during initial save (onSave rejects)', async () => {
        // Arrange: Setup error spy and rejecting onSave
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { }); // Silence console during test
        const mockError = new Error('Init Failed');
        const onSaveMock = vi.fn().mockRejectedValue(mockError);
        let currentErrorMessage: string | null = null;

        // Arrange: Mock connection tester to enable save and capture error message
        mockHandleConnectionTestResult.mockImplementation((success: boolean, message?: string) => {
            const isValid = success;
            // Capture the message passed to the handler (which should be the translation key)
            currentErrorMessage = isValid ? null : message || null;
            (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
                isConnectionValid: isValid,
                connectionErrorMessage: currentErrorMessage,
                handleConnectionTestResult: mockHandleConnectionTestResult,
                resetConnectionTest: mockResetConnectionTest,
            }));
        });

        const { rerender } = renderSettings({ onSave: onSaveMock });

        // Act: Enable save button
        fireEvent.change(screen.getByTestId('connection-host-input'), { target: { value: 'fail-host' } });
        fireEvent.click(screen.getByTestId('connection-test-button-success')); // Simulate initial successful test
        // Wait specifically for the first call (true)
        await waitFor(() => expect(mockHandleConnectionTestResult).toHaveBeenCalledWith(true));
        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => expect(screen.getByTestId('settings-save-button')).not.toBeDisabled());

        // Act: Click Save (will trigger rejection)
        fireEvent.click(screen.getByTestId('settings-save-button'));

        // Assert: Check the last call to handleConnectionTestResult
        await waitFor(() => {
            expect(mockHandleConnectionTestResult).toHaveBeenCalledTimes(2);
        });
        expect(mockHandleConnectionTestResult).toHaveBeenLastCalledWith(
            false, // Indicates failure
            'errors.failedToInitializeConnection' // Expect the translation key
        );

        // Assert: Check UI update
        rerender(<Settings {...defaultProps} onSave={onSaveMock} isFirstStart={true} />);
        await waitFor(() => {
            const statusMessage = screen.getByTestId('settings-status-message');
            expect(statusMessage).toHaveAttribute('data-status', 'error');
            // Expect the StatusMessage to display the translation key (assuming mock t returns the key)
            expect(statusMessage.textContent).toBe('errors.failedToInitializeConnection');
        });

        // Assert: onClose was NOT called
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
});
