// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Saving.test.tsx
// Tests for Settings component - Normal Mode - Saving Logic
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '../Settings';
import { LoadConfig, SaveAllSettings } from '../../../../wailsjs/go/main/App';
import { ConnectionConfig } from '../../../App';

// --- Mocks ---
vi.mock('../ConnectionTab', () => ({ ConnectionTab: vi.fn(() => <div data-testid="connection-tab-mock">Connection Tab Mock</div>) }));
vi.mock('../LimitsTab', () => ({ LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>) }));

const mockGetPathChanges = vi.fn(() => ({ pathsToAdd: [], pathsToRemove: [], defaultPath: '' }));
const mockResetChanges = vi.fn();
vi.mock('../PathsTab', () => ({
    PathsTab: vi.fn(React.forwardRef((_, ref) => {
        React.useImperativeHandle(ref, () => ({
            getPathChanges: mockGetPathChanges,
            resetChanges: mockResetChanges,
        }));
        return <div data-testid="paths-tab-mock">Paths Tab Mock</div>;
    })),
}));

vi.mock('../../LoadingSpinner', () => ({ LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>) }));
// Mock useLocalization - relying on global mock

// Default props for Normal Mode tests
const defaultProps: SettingsProps = {
    onSave: vi.fn().mockResolvedValue(true), // Not directly used in normal mode save flow
    onClose: vi.fn(),
    isFirstStart: false,
};

// Helper function to render the component using the *actual* Settings component
// This is needed because we need to mock useSettingsSaver dynamically within tests
const renderActualSettings = async (props: Partial<SettingsProps> = {}) => {
    const { Settings: ActualSettings } = await import('../Settings');
    return render(<ActualSettings {...defaultProps} {...props} isFirstStart={false} />);
};

// Mock config for loading
const mockConfig: ConnectionConfig = {
    host: 'test-host', port: 1234, username: 'user', password: 'pw',
    maxUploadRatio: 2, slowSpeedLimit: 100, slowSpeedUnit: 'MiB/s'
};

// --- Tests ---

describe('Settings Component - Normal Mode - Saving', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Provide default mock implementations for Wails functions
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig);
        (SaveAllSettings as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (defaultProps.onSave as unknown as ReturnType<typeof vi.fn>).mockClear().mockResolvedValue(true);
        (defaultProps.onClose as unknown as ReturnType<typeof vi.fn>).mockClear();
        mockGetPathChanges.mockClear().mockReturnValue({ pathsToAdd: [], pathsToRemove: [], defaultPath: '' });
        mockResetChanges.mockClear();
    });

    afterEach(() => {
        // Clean up dynamic mocks
        vi.unmock('../hooks/useSettingsSaver');
    });

    // Test Save button disabled state when saving
    it('disables Save button when saving', async () => {
        // Mock useSettingsSaver to control isSaving state
        vi.doMock('../hooks/useSettingsSaver', () => ({
            useSettingsSaver: vi.fn(() => ({
                isSaving: true, // Force isSaving to true
                handleSave: vi.fn(),
                saveError: null,
                validationErrors: {},
                settings: mockConfig,
                setSettings: vi.fn(),
                setPathsHaveChanges: vi.fn(),
                pathsHaveChanges: false,
                connectionTestStatus: null,
                setConnectionTestStatus: vi.fn(),
                handleConnectionTest: vi.fn(),
            })),
        }));

        await renderActualSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Check if the button is disabled due to isSaving=true
        await waitFor(() => {
            expect(screen.getByTestId('settings-save-button')).toBeDisabled();
        });
    });

    // Test dialog closing prevention (onPointerDownOutside)
    it('prevents closing and does not call onClose when clicking outside if saving', async () => {
        // Mock useSettingsSaver to control isSaving state
        vi.doMock('../hooks/useSettingsSaver', () => ({
            useSettingsSaver: vi.fn(() => ({
                isSaving: true, // Force isSaving to true
                handleSave: vi.fn(),
                saveError: null,
                validationErrors: {},
                settings: mockConfig,
                setSettings: vi.fn(),
                setPathsHaveChanges: vi.fn(),
                pathsHaveChanges: false,
                connectionTestStatus: null,
                setConnectionTestStatus: vi.fn(),
                handleConnectionTest: vi.fn(),
            })),
        }));

        await renderActualSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Simulate click outside - Radix Dialog calls onPointerDownOutside on the Content
        // The component prevents event propagation if isSaving is true.
        // We test that onClose is NOT called after a simulated external interaction.
        fireEvent.pointerDown(document.body); // Simulate a click somewhere outside

        // Wait a bit to ensure async operations (if any) complete
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    // Test dialog closing prevention (Escape key)
    it('prevents closing and does not call onClose on Escape key if saving', async () => {
        // Mock useSettingsSaver to control isSaving state
        vi.doMock('../hooks/useSettingsSaver', () => ({
            useSettingsSaver: vi.fn(() => ({
                isSaving: true, // Force isSaving to true
                handleSave: vi.fn(),
                saveError: null,
                validationErrors: {},
                settings: mockConfig,
                setSettings: vi.fn(),
                setPathsHaveChanges: vi.fn(),
                pathsHaveChanges: false,
                connectionTestStatus: null,
                setConnectionTestStatus: vi.fn(),
                handleConnectionTest: vi.fn(),
            })),
        }));

        await renderActualSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Simulate Escape key press
        const dialogContent = screen.getByRole('dialog');
        fireEvent.keyDown(dialogContent, { key: 'Escape', code: 'Escape' });

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 50));

        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
});
