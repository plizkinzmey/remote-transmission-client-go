import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App';
import { useConnectionTester } from '@components/Settings/hooks/useConnectionTester';
import { useSettingsSaver } from '@components/Settings/hooks/useSettingsSaver';

// --- Mocks ---
// Mock child components relevant to First Start
vi.mock('@components/Settings/ConnectionTab', () => ({
    ConnectionTab: vi.fn(() => <div data-testid="connection-tab-mock">Connection Tab Mock</div>),
}));
vi.mock('@components/LanguageSelector', () => ({
    LanguageSelector: vi.fn(() => <div data-testid="language-selector-mock">Language Selector Mock</div>),
}));
vi.mock('@components/StatusMessage', () => ({
    default: vi.fn(({ status, message, 'data-testid': dataTestId }) => (
        <div data-testid={dataTestId || 'status-message-mock'} data-status={status}>
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
    >(() => ({
        isSaving: false,
        handleSave: mockSaverHandleSave,
        resetChanges: mockSaverResetChanges,
    }));
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
describe('Settings Component - First Start Mode - Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null); // Ensure LoadConfig doesn't cause loading state
        (useConnectionTester as ReturnType<typeof vi.fn>).mockImplementation(() => ({
            isConnectionValid: false,
            connectionErrorMessage: null,
            handleConnectionTestResult: mockHandleConnectionTestResult,
            resetConnectionTest: mockResetConnectionTest,
        }));
    });

    it('renders directly without loading spinner', () => {
        renderSettings();
        expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('loading-spinner-mock')).not.toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

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

        // Save button should be disabled initially
        expect(screen.getByTestId('settings-save-button')).toBeDisabled();
    });
});
