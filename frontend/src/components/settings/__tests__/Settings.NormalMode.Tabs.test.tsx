// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Tabs.test.tsx
// Tests for Settings component - Normal Mode - Tab Switching Logic
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
// Use aliases for imports
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App'; // Assuming ConnectionConfig is exported from App.tsx at src level
import { within } from '@testing-library/react'; // Import within

// --- Mocks ---

// Define mock functions before they are used in vi.mock
const mockGetPathChanges = vi.fn();
const mockResetChanges = vi.fn();

// Mock components using aliases
vi.mock('@components/Settings/ConnectionTab', () => ({ ConnectionTab: vi.fn(() => <div data-testid="connection-tab-mock">Connection Tab Mock</div>) }));
vi.mock('@components/Settings/LimitsTab', () => ({ LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>) }));
vi.mock('@components/LoadingSpinner', () => ({ LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>) }));

// Corrected mock for PathsTab using forwardRef correctly
vi.mock('@components/Settings/PathsTab', () => ({
    PathsTab: React.forwardRef((_props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            getPathChanges: mockGetPathChanges,
            resetChanges: mockResetChanges,
        }));
        return <div data-testid="paths-tab-mock">Paths Tab Mock</div>;
    })
}));

// Mock useLocalization - relying on global mock
// Mock useSettingsSaver - default mock (isSaving: false) is sufficient for tab tests

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

describe('Settings Component - Normal Mode - Tab Switching', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Ensure LoadConfig mock returns the correct type
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig as any); // Cast if necessary
        (defaultProps.onClose as ReturnType<typeof vi.fn>).mockClear();
        // Reset mocks defined outside
        mockGetPathChanges.mockClear();
        mockResetChanges.mockClear();
    });

    // Test switching to Limits tab
    it('switches to Limits tab and renders its content', async () => {
        const user = userEvent.setup();
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        const limitsTabTrigger = screen.getByTestId('settings-tab-limits');
        await user.click(limitsTabTrigger);

        await waitFor(() => {
            const activeTabPanel = screen.getByRole('tabpanel', { hidden: false });
            expect(activeTabPanel).toHaveAttribute('aria-labelledby', expect.stringContaining('trigger-limits'));
            expect(within(activeTabPanel).getByTestId('limits-tab-mock')).toBeInTheDocument();
        });
    });

    // Test switching to Paths tab
    it('switches to Paths tab and renders its content', async () => {
        const user = userEvent.setup();
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        const pathsTabTrigger = screen.getByTestId('settings-tab-paths');
        await user.click(pathsTabTrigger);

        await waitFor(() => {
            const activeTabPanel = screen.getByRole('tabpanel', { hidden: false });
            expect(activeTabPanel).toHaveAttribute('aria-labelledby', expect.stringContaining('trigger-paths'));
            expect(within(activeTabPanel).getByTestId('paths-tab-mock')).toBeInTheDocument();
        });
    });

    // Test switching back to Connection tab
    it('switches back to Connection tab after visiting another tab', async () => {
        const user = userEvent.setup();
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Go to Limits first
        const limitsTabTrigger = screen.getByTestId('settings-tab-limits');
        await user.click(limitsTabTrigger);
        await waitFor(() => {
            const activeTabPanel = screen.getByRole('tabpanel', { hidden: false });
            expect(within(activeTabPanel).getByTestId('limits-tab-mock')).toBeInTheDocument();
        });

        // Go back to Connection
        const connectionTabTrigger = screen.getByTestId('settings-tab-connection');
        await user.click(connectionTabTrigger);

        await waitFor(() => {
            const activeTabPanel = screen.getByRole('tabpanel', { hidden: false });
            expect(activeTabPanel).toHaveAttribute('aria-labelledby', expect.stringContaining('trigger-connection'));
            expect(within(activeTabPanel).getByTestId('connection-tab-mock')).toBeInTheDocument();
        });
    });
});
