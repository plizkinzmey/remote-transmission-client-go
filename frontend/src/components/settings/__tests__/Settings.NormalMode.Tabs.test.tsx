// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Tabs.test.tsx
// Tests for Settings component - Normal Mode - Tab Logic
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '../Settings';
import { LoadConfig } from '../../../../wailsjs/go/main/App';
import { ConnectionConfig } from '../../../App';

// --- Mocks ---
vi.mock('../ConnectionTab', () => ({
    ConnectionTab: vi.fn(({ settings, onSettingsChange }) => (
        <div data-testid="connection-tab-mock">
            Connection Tab Mock
            <input
                data-testid="connection-host-input"
                value={settings.host}
                onChange={(e) => onSettingsChange({ host: e.target.value })}
            />
        </div>
    )),
}));

vi.mock('../LimitsTab', () => ({
    LimitsTab: vi.fn(({ settings, onSettingsChange }) => (
        <div data-testid="limits-tab-mock">
            Limits Tab Mock
            <input
                data-testid="limits-ratio-input"
                type="number"
                value={settings.maxUploadRatio}
                onChange={(e) => onSettingsChange({ maxUploadRatio: Number(e.target.value) })}
            />
        </div>
    )),
}));

const mockGetPathChanges = vi.fn(() => ({ pathsToAdd: [], pathsToRemove: [], defaultPath: '' }));
const mockResetChanges = vi.fn();
interface PathsTabProps {
    onPathsChanged: (hasChanges: boolean) => void;
}
vi.mock('../PathsTab', () => ({
    PathsTab: vi.fn(React.forwardRef(({ onPathsChanged }: PathsTabProps, ref) => {
        React.useImperativeHandle(ref, () => ({
            getPathChanges: mockGetPathChanges,
            resetChanges: mockResetChanges,
        }));
        return (
            <div data-testid="paths-tab-mock">
                Paths Tab Mock
                <button data-testid="paths-change-button" onClick={() => onPathsChanged(true)}>Change Path</button>
            </div>
        );
    })),
}));

vi.mock('../../LoadingSpinner', () => ({ LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>) }));
// Mock useLocalization - relying on global mock
// Mock useSettingsSaver - default mock (isSaving: false) is sufficient

// Default props for Normal Mode tests
const defaultProps: SettingsProps = {
    onSave: vi.fn().mockResolvedValue(true),
    onClose: vi.fn(),
    isFirstStart: false,
};

// Helper function to render the component
const renderSettings = (props: Partial<SettingsProps> = {}) => {
    return render(<Settings {...defaultProps} {...props} isFirstStart={false} />);
};

// Mock config for loading
const mockConfig: ConnectionConfig = {
    host: 'test-host', port: 1234, username: 'user', password: 'pw',
    maxUploadRatio: 2, slowSpeedLimit: 100, slowSpeedUnit: 'MiB/s'
};

// --- Tests ---

describe('Settings Component - Normal Mode - Tabs', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig);
        (defaultProps.onClose as unknown as ReturnType<typeof vi.fn>).mockClear();
        mockGetPathChanges.mockClear().mockReturnValue({ pathsToAdd: [], pathsToRemove: [], defaultPath: '' });
        mockResetChanges.mockClear();
    });

    // Test tab switching
    it('switches between tabs correctly', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Initially, Connection tab is active
        expect(screen.getByTestId('connection-tab-mock')).toBeInTheDocument();
        expect(screen.queryByTestId('limits-tab-mock')).not.toBeInTheDocument();
        expect(screen.queryByTestId('paths-tab-mock')).not.toBeInTheDocument();

        // Click Limits tab
        fireEvent.click(screen.getByTestId('settings-tab-limits'));
        await waitFor(() => {
            expect(screen.queryByTestId('connection-tab-mock')).not.toBeInTheDocument();
            expect(screen.getByTestId('limits-tab-mock')).toBeInTheDocument();
            expect(screen.queryByTestId('paths-tab-mock')).not.toBeInTheDocument();
        });

        // Click Paths tab
        fireEvent.click(screen.getByTestId('settings-tab-paths'));
        await waitFor(() => {
            expect(screen.queryByTestId('connection-tab-mock')).not.toBeInTheDocument();
            expect(screen.queryByTestId('limits-tab-mock')).not.toBeInTheDocument();
            expect(screen.getByTestId('paths-tab-mock')).toBeInTheDocument();
        });

        // Click Connection tab again
        fireEvent.click(screen.getByTestId('settings-tab-connection'));
        await waitFor(() => {
            expect(screen.getByTestId('connection-tab-mock')).toBeInTheDocument();
            expect(screen.queryByTestId('limits-tab-mock')).not.toBeInTheDocument();
            expect(screen.queryByTestId('paths-tab-mock')).not.toBeInTheDocument();
        });
    });

    // Test settings changes within tabs
    it('updates settings state when changed in tabs', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Change host in ConnectionTab
        const hostInput = screen.getByTestId('connection-host-input');
        fireEvent.change(hostInput, { target: { value: 'new-host' } });
        await waitFor(() => expect(hostInput).toHaveValue('new-host'));

        // Switch to Limits tab
        fireEvent.click(screen.getByTestId('settings-tab-limits'));
        await waitFor(() => expect(screen.getByTestId('limits-tab-mock')).toBeInTheDocument());

        // Change ratio in LimitsTab
        const ratioInput = screen.getByTestId('limits-ratio-input');
        fireEvent.change(ratioInput, { target: { value: '10' } });
        await waitFor(() => expect(ratioInput).toHaveValue(10));

        // Saving logic is tested separately
    });
});
