// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Closing.test.tsx
// Tests for Settings component - Normal Mode - Closing Logic
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
// Use aliases for imports
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App'; // Assuming ConnectionConfig is exported from App.tsx at src level
import { act } from 'react'; // Import act
import userEvent from '@testing-library/user-event'; // Import userEvent
import { within } from '@testing-library/react'; // Import within

// --- Mocks ---

// Define mock functions before they are used in vi.mock
const mockGetPathChanges = vi.fn(() => ({ pathsToAdd: [], pathsToRemove: [], defaultPath: '' }));
const mockResetChanges = vi.fn();

// Mock components using aliases
vi.mock('@components/Settings/ConnectionTab', () => ({ ConnectionTab: vi.fn(() => <div data-testid="connection-tab-mock">Connection Tab Mock</div>) }));
vi.mock('@components/Settings/LimitsTab', () => ({ LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>) }));
vi.mock('@components/LoadingSpinner', () => ({ LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>) }));

// Corrected mock for PathsTab using forwardRef correctly and adding simulation button
interface MockPathsTabProps {
    onPathsChanged: (hasChanges: boolean) => void;
}
vi.mock('@components/Settings/PathsTab', () => ({
    PathsTab: React.forwardRef(({ onPathsChanged }: MockPathsTabProps, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            getPathChanges: mockGetPathChanges,
            resetChanges: mockResetChanges,
        }));
        return (
            <div data-testid="paths-tab-mock">
                Paths Tab Mock
                {/* Add a button to simulate making changes */}
                <button data-testid="paths-simulate-change" onClick={() => onPathsChanged(true)}>
                    Simulate Path Change
                </button>
                <button data-testid="paths-simulate-no-change" onClick={() => onPathsChanged(false)}>
                    Simulate No Path Change
                </button>
            </div>
        );
    })
}));

// Mock useLocalization - relying on global mock
// Mock useSettingsSaver - default mock (isSaving: false) is sufficient for closing tests

// Default props for Normal Mode tests
const defaultProps: SettingsProps = {
    onSave: vi.fn().mockResolvedValue(true),
    onClose: vi.fn(),
    isFirstStart: false,
};

// Helper function to render the component
const renderSettings = (props: Partial<SettingsProps> = {}) => {
    // Ensure isFirstStart is explicitly false for normal mode tests
    return render(<Settings {...defaultProps} {...props} isFirstStart={false} />);
};

// Mock config for loading
const mockConfig: ConnectionConfig = {
    host: 'test-host', port: 1234, username: 'user', password: 'pw',
    maxUploadRatio: 2, slowSpeedLimit: 100, slowSpeedUnit: 'MiB/s'
};

// --- Tests ---

describe('Settings Component - Normal Mode - Closing', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Ensure LoadConfig mock returns the correct type
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig as any); // Cast if necessary
        (defaultProps.onClose as ReturnType<typeof vi.fn>).mockClear();
        // Reset mocks defined outside
        mockGetPathChanges.mockClear().mockReturnValue({ pathsToAdd: [], pathsToRemove: [], defaultPath: '' });
        mockResetChanges.mockClear();
    });

    // Helper to simulate path changes
    const simulatePathChange = async () => {
        const user = userEvent.setup();
        const pathsTabTrigger = screen.getByTestId('settings-tab-paths');
        await user.click(pathsTabTrigger);

        // Wait for the correct Tabs.Content to become active and contain the mock
        await waitFor(() => {
            // Find the content panel that is currently visible (not hidden)
            const activeTabPanel = screen.getByRole('tabpanel', { hidden: false });
            // Verify it's the 'paths' panel by checking its 'aria-labelledby'
            expect(activeTabPanel).toHaveAttribute('aria-labelledby', expect.stringContaining('trigger-paths'));
            // Verify our mock content is rendered within the active panel
            expect(within(activeTabPanel).getByTestId('paths-tab-mock')).toBeInTheDocument();
        });

        // Now click the button inside the mock tab content
        const simulateChangeButton = screen.getByTestId('paths-simulate-change');
        await user.click(simulateChangeButton);
        // Wait for any potential state updates triggered by onPathsChanged
        await act(async () => { });
    };

    // --- Tests where changes ARE made ---
    it('calls onClose and resets path changes when Cancel is clicked *if changes exist*', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        await simulatePathChange(); // Simulate change

        const cancelButton = screen.getByTestId('settings-cancel-button');
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockResetChanges).toHaveBeenCalledTimes(1); // Should be called
    });

    it('calls onClose and resets path changes via Escape key *if changes exist*', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        await simulatePathChange(); // Simulate change

        const dialogContent = screen.getByRole('dialog');
        fireEvent.focus(dialogContent);
        fireEvent.keyDown(dialogContent, { key: 'Escape', code: 'Escape', keyCode: 27, charCode: 27 });

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockResetChanges).toHaveBeenCalledTimes(1); // Should be called
    });

    it('calls onClose and resets path changes via outside click *if changes exist*', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        await simulatePathChange(); // Simulate change

        const dialogContent = screen.getByRole('dialog');
        fireEvent.focus(dialogContent);
        // Simulate Radix closing via Escape as proxy for outside click
        fireEvent.keyDown(dialogContent, { key: 'Escape', code: 'Escape', keyCode: 27, charCode: 27 });

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockResetChanges).toHaveBeenCalledTimes(1); // Should be called
    });

    // --- Tests where NO changes are made ---

    it('calls onClose but *does not* reset path changes when Cancel is clicked *if no changes exist*', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // No change simulation here

        const cancelButton = screen.getByTestId('settings-cancel-button');
        fireEvent.click(cancelButton);

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockResetChanges).not.toHaveBeenCalled(); // Should NOT be called
    });

    it('calls onClose but *does not* reset path changes via Escape key *if no changes exist*', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // No change simulation here

        const dialogContent = screen.getByRole('dialog');
        fireEvent.focus(dialogContent);
        fireEvent.keyDown(dialogContent, { key: 'Escape', code: 'Escape', keyCode: 27, charCode: 27 });

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockResetChanges).not.toHaveBeenCalled(); // Should NOT be called
    });

    it('calls onClose but *does not* reset path changes via outside click *if no changes exist*', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // No change simulation here

        const dialogContent = screen.getByRole('dialog');
        fireEvent.focus(dialogContent);
        // Simulate Radix closing via Escape as proxy for outside click
        fireEvent.keyDown(dialogContent, { key: 'Escape', code: 'Escape', keyCode: 27, charCode: 27 });

        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
        expect(mockResetChanges).not.toHaveBeenCalled(); // Should NOT be called
    });
});
