// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Rendering.test.tsx
// Tests for Settings component - Normal Mode - Rendering Logic
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Settings, SettingsProps } from '../Settings';
import { LoadConfig } from '../../../../wailsjs/go/main/App';
import { ConnectionConfig } from '../../../App';

// --- Mocks ---
vi.mock('../ConnectionTab', () => ({ ConnectionTab: vi.fn(() => <div data-testid="connection-tab-mock">Connection Tab Mock</div>) }));
vi.mock('../LimitsTab', () => ({ LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>) }));
vi.mock('../PathsTab', () => ({ PathsTab: vi.fn(React.forwardRef((_, ref) => { React.useImperativeHandle(ref, () => ({ getPathChanges: vi.fn(), resetChanges: vi.fn() })); return <div data-testid="paths-tab-mock">Paths Tab Mock</div>; })) }));
vi.mock('../../LanguageSelector', () => ({ LanguageSelector: vi.fn(() => <div data-testid="language-selector-mock">Language Selector Mock</div>) }));
vi.mock('../../StatusMessage', () => ({ default: vi.fn(({ message, 'data-testid': dataTestId }) => <div data-testid={dataTestId || 'status-message-mock'}>{message}</div>) }));
vi.mock('../../LoadingSpinner', () => ({ LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>) }));
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
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockConfig);
        (defaultProps.onClose as unknown as ReturnType<typeof vi.fn>).mockClear();
    });

    // Test initial rendering in loading state
    it('renders loading spinner initially', async () => {
        (LoadConfig as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            () => new Promise(resolve => setTimeout(() => resolve(mockConfig), 50))
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
        expect(screen.getByTestId('connection-tab-mock')).toBeInTheDocument(); // Default tab
        expect(screen.getByTestId('settings-save-button')).not.toBeDisabled(); // Enabled by default
    });
});
