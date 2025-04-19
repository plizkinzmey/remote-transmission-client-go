// Tests for Settings component - First Start Mode
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '@components/Settings/Settings'; // Use path alias
import { LoadConfig, SaveAllSettings } from '@wailsjs/go/main/App'; // Use path alias
import { ConnectionConfig } from '@app/App'; // Use path alias

// --- Mocks ---

// Mock child components relevant to First Start
vi.mock('@components/Settings/ConnectionTab', () => ({ // Use path alias
    ConnectionTab: vi.fn(({ settings, onSettingsChange, onConnectionTest, errors }) => (
        <div data-testid="connection-tab-mock">
            Connection Tab Mock
            <input
                data-testid="connection-host-input"
                value={settings.host}
                onChange={(e) => onSettingsChange({ host: e.target.value })}
            />
            <button data-testid="connection-test-button-success" onClick={() => onConnectionTest(true)}>Test Success</button>
            <button data-testid="connection-test-button-fail" onClick={() => onConnectionTest(false, 'Custom error message')}>Test Fail</button>
            {errors?.host && <span data-testid="connection-host-error">{errors.host}</span>}
        </div>
    )),
}));

// LimitsTab and PathsTab are not rendered in first start, no need to mock them here.

vi.mock('@components/LanguageSelector', () => ({ // Use path alias
    LanguageSelector: vi.fn(() => <div data-testid="language-selector-mock">Language Selector Mock</div>),
}));

vi.mock('@components/StatusMessage', () => ({ // Use path alias
    default: vi.fn(({ status, message, 'data-testid': dataTestId }) => (
        <div data-testid={dataTestId || 'status-message-mock'} data-status={status}>
            {message}
        </div>
    )),
}));

vi.mock('@components/LoadingSpinner', () => ({ // Use path alias
    LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>),
}));

// Mock useLocalization - relying on global mock

// Default props for First Start tests
const defaultProps: SettingsProps = {
    onSave: vi.fn().mockResolvedValue(true) as unknown as (settings: ConnectionConfig) => Promise<boolean>,
    onClose: vi.fn() as unknown as () => void,
    isFirstStart: true, // Explicitly set for this test suite
};

// Helper function to render the component
const renderSettings = (props: Partial<SettingsProps> = {}) => {
    // Ensure isFirstStart is always true for this suite
    return render(<Settings {...defaultProps} {...props} isFirstStart={true} />);
};

// --- Tests ---

describe('Settings Component - First Start Mode', () => {
    // Reset mocks before each test
    beforeEach(() => {
        vi.clearAllMocks();
        // Правильная типизация моков
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (SaveAllSettings as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
        (defaultProps.onSave as unknown as ReturnType<typeof vi.fn>).mockClear();
        (defaultProps.onClose as unknown as ReturnType<typeof vi.fn>).mockClear();
    });

    // Test initial rendering in first start mode (no loading)
    it('renders directly without loading spinner', () => {
        renderSettings();
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loading-spinner-mock')).not.toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Test rendering in first start mode
    it('renders correctly', () => {
        renderSettings();

        // Check title
        expect(screen.getByTestId('settings-title')).toHaveTextContent('settings.firstStartTitle');

        // Check message
        expect(screen.getByTestId('settings-first-start-message')).toBeInTheDocument();

        // Check language selector presence
        expect(screen.getByTestId('language-selector-mock')).toBeInTheDocument();

        // Check tabs - only Connection should be visible
        expect(screen.getByTestId('settings-tab-connection')).toBeInTheDocument();
        expect(screen.queryByTestId('settings-tab-limits')).not.toBeInTheDocument();
        expect(screen.queryByTestId('settings-tab-paths')).not.toBeInTheDocument();

        // Check buttons - only Save should be visible
        expect(screen.getByTestId('settings-save-button')).toBeInTheDocument();
        expect(screen.queryByTestId('settings-cancel-button')).not.toBeInTheDocument();

        // Check if ConnectionTab mock is rendered
        expect(screen.getByTestId('connection-tab-mock')).toBeInTheDocument();
        expect(screen.queryByTestId('limits-tab-mock')).not.toBeInTheDocument();
        expect(screen.queryByTestId('paths-tab-mock')).not.toBeInTheDocument();

        // Save button should be disabled initially in first start until connection is valid
        expect(screen.getByTestId('settings-save-button')).toBeDisabled();
    });

    // Test Save button disabled state (integration with hooks)
    it('enables Save button after successful connection test', async () => {
        renderSettings();
        const saveButton = screen.getByTestId('settings-save-button');
        expect(saveButton).toBeDisabled(); // Initially disabled

        // Simulate successful connection test
        const testButton = screen.getByTestId('connection-test-button-success');
        fireEvent.click(testButton);
        await waitFor(() => {
            expect(saveButton).not.toBeDisabled(); // Should be enabled now
        });
    });

    // Test onSave prop call during first start
    it('calls onSave prop with settings when saving after successful test', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        const saveButton = screen.getByTestId('settings-save-button');
        expect(saveButton).toBeDisabled(); // Initially disabled

        // Simulate filling required fields (e.g., host)
        const hostInput = screen.getByTestId('connection-host-input');
        fireEvent.change(hostInput, { target: { value: 'first-start-host' } });

        // Simulate successful connection test
        const testButton = screen.getByTestId('connection-test-button-success');
        fireEvent.click(testButton);
        await waitFor(() => {
            expect(saveButton).not.toBeDisabled(); // Should be enabled now
        });

        // Click Save
        fireEvent.click(saveButton);

        // Wait for the save process (which involves calling onSave in first start)
        await waitFor(() => {
            // Check if the onSave prop (mocked in defaultProps) was called
            // The actual call happens inside useSettingsSaver, which calls onConnectionInitNeeded,
            // which is mapped to onSave in the Settings component.
            expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
            // Check if it was called with the current settings
            expect(defaultProps.onSave).toHaveBeenCalledWith(expect.objectContaining({ host: 'first-start-host' }));
        });
    });

});
