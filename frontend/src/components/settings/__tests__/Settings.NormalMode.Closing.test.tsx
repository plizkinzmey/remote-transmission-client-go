// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Closing.test.tsx
// Tests for Settings component - Normal Mode - Closing Logic
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
// Use aliases for imports
import { Settings } from '@components/Settings/Settings';
import { PathsTabRef } from '@components/Settings/PathsTab';

// Mock components
vi.mock('@components/Settings/ConnectionTab', () => ({
    ConnectionTab: vi.fn(({ onChange }) => (
        <div data-testid="connection-tab-mock">
            <input
                data-testid="connection-host-input"
                onChange={(e) => onChange?.({ host: e.target.value })}
            />
            <button data-testid="connection-test-button">Test Connection</button>
        </div>
    ))
}));

vi.mock('@components/Settings/LimitsTab', () => ({
    LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>)
}));

// Mock for PathsTab ref's resetChanges and the ref object itself
const mockPathsTabResetChanges = vi.fn();
const mockPathsTabRefObject = {
    getPathChanges: vi.fn(() => ({ pathsToAdd: [], pathsToRemove: [], defaultPath: null })),
    resetChanges: mockPathsTabResetChanges,
    saveChanges: vi.fn().mockResolvedValue(undefined),
    hasChanges: false,
};

interface MockPathsTabProps {
    onPathsChanged: (hasChanges: boolean) => void;
}

vi.mock('@components/Settings/PathsTab', () => ({
    PathsTab: React.forwardRef<PathsTabRef, MockPathsTabProps>(
        function MockedPathsTab({ onPathsChanged }, ref) {
            // Directly assign the mock object to the ref's current property
            // This is less standard but might bypass useEffect timing issues in mocks
            if (ref && typeof ref === 'object') {
                ref.current = mockPathsTabRefObject;
            }
            else if (typeof ref === 'function') {
                // If it's a callback ref, call it immediately
                // Note: This might not perfectly mimic real-world ref callback timing
                ref(mockPathsTabRefObject);
            }

            return (
                <div data-testid="paths-tab-mock">
                    Paths Tab Mock
                    <button
                        data-testid="paths-simulate-change"
                        onClick={() => onPathsChanged(true)}
                    >
                        Simulate Change
                    </button>
                </div>
            );
        }
    )
}));

vi.mock('@components/LoadingSpinner', () => ({
    LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>)
}));

vi.mock('@wailsjs/go/main/App', () => ({
    LoadConfig: vi.fn().mockResolvedValue({
        host: 'test-host',
        port: 1234,
        username: 'user',
        password: 'pw',
        maxUploadRatio: 2,
        slowSpeedLimit: 100,
        slowSpeedUnit: 'MiB/s'
    }),
    SaveAllSettings: vi.fn()
}));

// Hoist mock function declarations
const { mockHandleSave, mockResetSaverChanges } = vi.hoisted(() => {
    return {
        mockHandleSave: vi.fn(),
        mockResetSaverChanges: vi.fn(),
    };
});

// Mock useSettingsSaver using vi.mock
// Import the actual hook type if needed for casting, or use 'any'
import { useSettingsSaver as actualUseSettingsSaver } from '@components/Settings/hooks/useSettingsSaver';

vi.mock('@components/Settings/hooks/useSettingsSaver', () => ({
    useSettingsSaver: vi.fn().mockReturnValue({ // Use vi.fn().mockReturnValue
        isSaving: false,
        handleSave: mockHandleSave, // Use hoisted mock
        resetChanges: mockResetSaverChanges, // Use hoisted mock
        // Add other properties returned by the hook if they are accessed by Settings component
    }),
}));

const defaultProps = {
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(true),
    isFirstStart: false,
};

describe('Settings Component - Normal Mode - Closing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset useSettingsSaver mock
        (actualUseSettingsSaver as ReturnType<typeof vi.fn>).mockReturnValue({
            isSaving: false,
            handleSave: mockHandleSave,
            resetChanges: mockResetSaverChanges,
        });
        defaultProps.onClose.mockClear();
        mockResetSaverChanges.mockClear();
        // Reset the specific mock function for the ref method
        mockPathsTabResetChanges.mockClear();
        // Optionally reset other methods on the mock ref object if needed
        mockPathsTabRefObject.getPathChanges.mockClear();
        mockPathsTabRefObject.saveChanges.mockClear();
    });

    afterEach(() => {
        vi.resetModules();
    });

    it('properly resets all states when closed via cancel button', async () => {
        render(<Settings {...defaultProps} />);

        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        // Activate Paths tab first
        const pathsTabTrigger = screen.getByTestId('settings-tab-paths');
        await act(async () => {
            await userEvent.click(pathsTabTrigger);
        });
        // Optional: Wait for potential tab content changes if needed
        // await waitFor(() => expect(screen.getByTestId('paths-tab-mock')).toBeVisible());

        const cancelButton = screen.getByTestId('settings-cancel-button');
        await act(async () => {
            await userEvent.click(cancelButton);
        });

        await waitFor(() => {
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
            // Check both reset functions are called
            expect(mockResetSaverChanges).toHaveBeenCalledTimes(1);
            expect(mockPathsTabResetChanges).toHaveBeenCalledTimes(1);
        });
    });

    it('properly resets all states when closed via dialog close', async () => {
        render(<Settings {...defaultProps} />);

        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        // Activate Paths tab first
        const pathsTabTrigger = screen.getByTestId('settings-tab-paths');
        await act(async () => {
            await userEvent.click(pathsTabTrigger);
        });
        // Optional: Wait for potential tab content changes if needed
        // await waitFor(() => expect(screen.getByTestId('paths-tab-mock')).toBeVisible());

        await act(async () => {
            const overlay = document.querySelector('.rt-DialogOverlay');
            if (overlay) {
                fireEvent.pointerDown(overlay);
            } else {
                // Fallback if overlay selector changes
                fireEvent.pointerDown(document.body);
            }
        });

        await waitFor(() => {
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
            // Check both reset functions are called
            expect(mockResetSaverChanges).toHaveBeenCalledTimes(1);
            expect(mockPathsTabResetChanges).toHaveBeenCalledTimes(1);
        });
    });
});
