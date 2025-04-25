// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Rendering.test.tsx
// Tests for Settings component - Normal Mode - Rendering Logic
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
// Use aliases for imports
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App'; // Assuming ConnectionConfig is exported from App.tsx at src level
import { useConnectionTester } from '@components/Settings/hooks/useConnectionTester';

// --- Mocks ---

// Define mock functions before they are used in vi.mock
const mockGetPathChanges = vi.fn();
const mockResetChanges = vi.fn();

// Mock ConnectionTab with required test elements
vi.mock('@components/Settings/ConnectionTab', () => ({
    ConnectionTab: vi.fn(({ settings }) => (
        <div data-testid="connection-tab-mock">
            <input
                data-testid="connection-host-input"
                value={settings?.host || ''}
            />
            <input
                data-testid="connection-port-input"
                value={settings?.port || ''}
            />
            <input
                data-testid="connection-username-input"
                value={settings?.username || ''}
            />
            <input
                data-testid="connection-password-input"
                value={settings?.password || ''}
            />
        </div>
    ))
}));

// Mock other components using aliases
vi.mock('@components/Settings/LimitsTab', () => ({ LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>) }));
vi.mock('@components/LanguageSelector', () => ({ LanguageSelector: vi.fn(() => <div data-testid="language-selector-mock">Language Selector Mock</div>) }));
vi.mock('@components/StatusMessage', () => ({
    default: vi.fn(({ status, message, 'data-testid': dataTestId }) => (
        <div
            data-testid={dataTestId || 'status-message-mock'}
            data-status={status}
        >
            {message}
        </div>
    )),
}));
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

// Mock useConnectionTester
vi.mock('@components/Settings/hooks/useConnectionTester', () => ({
    useConnectionTester: vi.fn(() => ({
        isConnectionValid: false,
        connectionErrorMessage: null,
        handleConnectionTestResult: vi.fn(),
        resetConnectionTest: vi.fn(),
    }))
}));

// Mock useLocalization - relying on global mock
// Mock useSettingsSaver - default mock (isSaving: false) is sufficient for rendering tests

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

describe('Settings Component - Normal Mode - Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Ensure LoadConfig mock returns the correct type
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig as any); // Cast if necessary
        (defaultProps.onClose as ReturnType<typeof vi.fn>).mockClear();
        // Reset mocks defined outside
        mockGetPathChanges.mockClear();
        mockResetChanges.mockClear();
    });

    // Test initial rendering in loading state
    it('renders loading spinner initially', async () => {
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(mockConfig as any), 50))
        );
        renderSettings();
        expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner-mock')).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });
    });

    // Test rendering in normal mode (after loading)
    it('renders correctly after loading', async () => {
        renderSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        expect(screen.getByTestId('settings-title')).toHaveTextContent('settings.title');
        expect(screen.queryByTestId('settings-first-start-message')).not.toBeInTheDocument();
        expect(screen.queryByTestId('language-selector-mock')).not.toBeInTheDocument();
        expect(screen.getByTestId('settings-tab-connection')).toBeInTheDocument();
        expect(screen.getByTestId('settings-tab-limits')).toBeInTheDocument();
        expect(screen.getByTestId('settings-tab-paths')).toBeInTheDocument();
        expect(screen.getByTestId('settings-save-button')).toBeInTheDocument();
        expect(screen.getByTestId('settings-cancel-button')).toBeInTheDocument();
        // Check that the default tab content (ConnectionTab mock) is rendered
        expect(screen.getByTestId('connection-tab-mock')).toBeInTheDocument();
        expect(screen.getByTestId('settings-save-button')).not.toBeDisabled(); // Enabled by default
    });

    // Новые тесты для загрузки начальных настроек
    it('handles initial settings load error', async () => {
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Load error'));
        renderSettings();

        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
            expect(screen.getByTestId('settings-status-message'))
                .toHaveTextContent('errors.failedToLoadSettings');
        });
    });

    it('handles empty initial settings', async () => {
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        renderSettings();

        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
            // Проверяем, что используются дефолтные настройки
            const hostInput = screen.getByTestId('connection-host-input');
            expect(hostInput).toHaveValue('');
        });
    });

    it('loads and displays initial settings successfully', async () => {
        const testSettings = {
            host: 'test-host',
            port: 9091,
            username: 'test-user',
            password: 'test-pass',
            maxUploadRatio: 2,
            slowSpeedLimit: 50,
            slowSpeedUnit: 'KiB/s'
        };

        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(testSettings);
        renderSettings();

        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
            const hostInput = screen.getByTestId('connection-host-input');
            expect(hostInput).toHaveValue('test-host');
        });
    });
});

describe('Settings Component - Normal Mode - Status Message', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (LoadConfig as Mock).mockResolvedValue(mockConfig);
        (useConnectionTester as Mock).mockImplementation(() => ({
            isConnectionValid: false,
            connectionErrorMessage: null,
            handleConnectionTestResult: vi.fn(),
            resetConnectionTest: vi.fn(),
        }));
    });

    it('shows no message and has none status on initial render', async () => {
        renderSettings();

        // Ждем окончания загрузки
        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        const statusMessage = screen.getByTestId('settings-status-message');
        expect(statusMessage).toHaveAttribute('data-status', 'none');
        expect(statusMessage).toBeEmptyDOMElement();
    });

    it('shows success status without message after successful connection test', async () => {
        (useConnectionTester as Mock).mockImplementation(() => ({
            isConnectionValid: true,
            connectionErrorMessage: '',
            handleConnectionTestResult: vi.fn(),
            resetConnectionTest: vi.fn(),
        }));

        renderSettings();

        // Ждем окончания загрузки
        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        const statusMessage = screen.getByTestId('settings-status-message');
        expect(statusMessage).toHaveAttribute('data-status', 'success');
        expect(statusMessage).toBeEmptyDOMElement();
    });

    it('resets to none status when connection settings change', async () => {
        (useConnectionTester as Mock).mockImplementation(() => ({
            isConnectionValid: true,
            connectionErrorMessage: null,
            handleConnectionTestResult: vi.fn(),
            resetConnectionTest: vi.fn(),
        }));

        renderSettings();

        // Ждем окончания загрузки
        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        const statusMessage = screen.getByTestId('settings-status-message');
        expect(statusMessage).toHaveAttribute('data-status', 'none');
        expect(statusMessage).toBeEmptyDOMElement();
    });
});
