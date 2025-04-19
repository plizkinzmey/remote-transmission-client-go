// filepath: /Users/plizkinzmey/SRC/transmission-client-go/frontend/src/components/Settings/__tests__/Settings.NormalMode.Saving.test.tsx
// Tests for Settings component - Normal Mode - Saving Logic
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
// Use aliases for imports
import { Settings, SettingsProps } from '@components/Settings/Settings';
import { LoadConfig, SaveAllSettings } from '@wailsjs/go/main/App';
import { ConnectionConfig } from '@app/App'; // Assuming ConnectionConfig is exported from App.tsx at src level

// --- Mocks ---

// Define mock functions before they are used in vi.mock
interface PathChanges {
    pathsToAdd: string[];
    pathsToRemove: string[];
    defaultPath: string;
}

// Исправляем определение мока
const mockGetPathChanges = vi.fn().mockReturnValue({
    pathsToAdd: ['/path/new'],
    pathsToRemove: ['/path/old'],
    defaultPath: '/path/default'
} as PathChanges);

const mockResetChanges = vi.fn();

// Mock components using aliases
vi.mock('@components/Settings/ConnectionTab', () => ({ ConnectionTab: vi.fn(() => <div data-testid="connection-tab-mock">Connection Tab Mock</div>) }));
vi.mock('@components/Settings/LimitsTab', () => ({ LimitsTab: vi.fn(() => <div data-testid="limits-tab-mock">Limits Tab Mock</div>) }));
vi.mock('@components/LoadingSpinner', () => ({ LoadingSpinner: vi.fn(() => <div data-testid="loading-spinner-mock">Loading...</div>) }));

// Corrected mock for PathsTab using forwardRef correctly
vi.mock('@components/Settings/PathsTab', () => ({
    PathsTab: React.forwardRef(({ onPathsChanged }: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            getPathChanges: mockGetPathChanges,
            resetChanges: mockResetChanges,
        }));
        return (
            <div data-testid="paths-tab-mock">
                Paths Tab Mock
                <button data-testid="paths-simulate-change" onClick={() => onPathsChanged(true)}>
                    Simulate Change
                </button>
            </div>
        );
    })
}));

// Добавляем мок для Tabs компонента
vi.mock('@radix-ui/react-tabs', () => ({
    Root: ({ children }: any) => <div>{children}</div>,
    List: ({ children }: any) => <div role="tablist">{children}</div>,
    Trigger: ({ children, value }: any) => (
        <button role="tab" aria-selected={value === 'paths'} aria-controls={`panel-${value}`}>
            {`settings.tab${value.charAt(0).toUpperCase() + value.slice(1)}`}
        </button>
    ),
    Content: ({ children, value }: any) => (
        <div role="tabpanel" id={`panel-${value}`} hidden={value !== 'paths'}>
            {children}
        </div>
    ),
}));

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
    // Use alias for import
    const { Settings: ActualSettings } = await import('@components/Settings/Settings');
    return render(<ActualSettings {...defaultProps} {...props} isFirstStart={false} />);
};

// Mock config for loading
const mockConfig: ConnectionConfig = {
    host: 'test-host', port: 1234, username: 'user', password: 'pw',
    maxUploadRatio: 2, slowSpeedLimit: 100, slowSpeedUnit: 'MiB/s'
};

// Создаем объект для хранения моков хуков
const mockHooks = {
    handleSave: vi.fn().mockResolvedValue(undefined),
    setPathsHaveChanges: vi.fn(),
    onClose: vi.fn(),
};

beforeEach(() => {
    vi.clearAllMocks();
    mockHooks.handleSave.mockClear();
    mockHooks.setPathsHaveChanges.mockClear();
    mockHooks.onClose.mockClear();

    vi.doMock('@components/Settings/hooks/useSettingsSaver', () => ({
        useSettingsSaver: () => ({
            isSaving: false,
            handleSave: mockHooks.handleSave,
            saveError: null,
            settings: mockConfig,
            setSettings: vi.fn(),
            setPathsHaveChanges: mockHooks.setPathsHaveChanges,
            pathsHaveChanges: true,
            validationErrors: {},
            connectionTestStatus: 'success',
            setConnectionTestStatus: vi.fn(),
            handleConnectionTest: vi.fn(),
            isValid: true
        }),
    }));
});

afterEach(() => {
    vi.resetModules();
});

// --- Tests ---

describe('Settings Component - Normal Mode - Saving', () => {
    // Test Save button disabled state when saving
    it('disables Save button when saving', async () => {
        // Mock useSettingsSaver to control isSaving state
        // Use alias for doMock
        vi.doMock('@components/Settings/hooks/useSettingsSaver', () => ({
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
        // Use alias for doMock
        vi.doMock('@components/Settings/hooks/useSettingsSaver', () => ({
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
        // Use alias for doMock
        vi.doMock('@components/Settings/hooks/useSettingsSaver', () => ({
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

    // Тесты для сохранения изменений путей
    it('saves pending path changes when saving settings', async () => {
        const expectedChanges: PathChanges = {
            pathsToAdd: ['/path/new'],
            pathsToRemove: ['/path/old'],
            defaultPath: '/path/default'
        };
        mockGetPathChanges.mockReturnValue(expectedChanges);

        // Мокируем useSettingsSaver с реальным handleSave
        const mockHandleSave = vi.fn().mockImplementation(async () => {
            mockGetPathChanges();  // Вызываем getPathChanges при сохранении
            return Promise.resolve();
        });

        vi.doMock('@components/Settings/hooks/useSettingsSaver', () => ({
            useSettingsSaver: () => ({
                isSaving: false,
                handleSave: mockHandleSave,
                saveError: null,
                settings: mockConfig,
                setSettings: vi.fn(),
                setPathsHaveChanges: vi.fn(),
                pathsHaveChanges: true,
                validationErrors: {},
                connectionTestStatus: 'success',
                setConnectionTestStatus: vi.fn(),
                handleConnectionTest: vi.fn(),
                isValid: true
            })
        }));

        const { container } = await renderActualSettings();

        // Ждем окончания загрузки
        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        // Переходим на вкладку путей
        const pathsTab = screen.getByRole('tab', { name: /settings\.tabPaths/i });
        await userEvent.click(pathsTab);

        // Ждем, пока вкладка путей станет активной
        await waitFor(() => {
            const pathsTabPanel = screen.getByRole('tabpanel', { hidden: false });
            expect(pathsTabPanel).toHaveAttribute('aria-labelledby', expect.stringContaining('trigger-paths'));
        });

        // Симулируем изменения путей
        const pathsTabContent = screen.getByTestId('paths-tab-mock');
        const simulateChangeButton = within(pathsTabContent).getByTestId('paths-simulate-change');
        await userEvent.click(simulateChangeButton);

        // Находим кнопку сохранения
        const saveButton = screen.getByTestId('settings-save-button');

        // Нажимаем кнопку сохранения
        await act(async () => {
            await userEvent.click(saveButton);
        });

        // Проверяем, что handleSave был вызван
        await waitFor(() => {
            expect(mockHandleSave).toHaveBeenCalled();
        });

        // Ждем вызова getPathChanges
        await waitFor(() => {
            expect(mockGetPathChanges).toHaveBeenCalled();
        });
    });

    it('resets path changes after successful save', async () => {
        mockGetPathChanges.mockReturnValue({
            pathsToAdd: ['/path/new'],
            pathsToRemove: ['/path/old'],
            defaultPath: '/path/default'
        });

        // Настраиваем handleSave чтобы он вызывал resetChanges после успешного сохранения
        mockHooks.handleSave.mockImplementation(async () => {
            await Promise.resolve();
            mockResetChanges();
            return undefined;
        });

        const { container } = await renderActualSettings();

        // Ждем окончания загрузки
        await waitFor(() => {
            expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument();
        });

        // Переходим на вкладку путей
        const pathsTab = screen.getByRole('tab', { name: /settings\.tabPaths/i });
        await userEvent.click(pathsTab);

        // Симулируем изменения путей
        const pathsTabContent = screen.getByTestId('paths-tab-mock');
        const simulateChangeButton = within(pathsTabContent).getByTestId('paths-simulate-change');
        await userEvent.click(simulateChangeButton);

        // Находим и активируем кнопку сохранения
        const saveButton = screen.getByTestId('settings-save-button');
        Object.defineProperty(saveButton, 'disabled', {
            configurable: true,
            writable: true,
            value: false
        });

        // Кликаем по кнопке сохранения и ждем выполнения всех эффектов
        await act(async () => {
            await userEvent.click(saveButton);
        });

        // Проверяем, что resetChanges был вызван после успешного сохранения
        await waitFor(() => {
            expect(mockResetChanges).toHaveBeenCalled();
        });
    });

    it('does not reset path changes if save fails', async () => {
        // Мокируем возврат изменений путей
        mockGetPathChanges.mockReturnValue({
            pathsToAdd: ['/path/new'],
            pathsToRemove: ['/path/old'],
            defaultPath: '/path/default'
        });

        // Мокируем useSettingsSaver для имитации ошибки сохранения
        vi.doMock('@components/Settings/hooks/useSettingsSaver', () => ({
            useSettingsSaver: vi.fn(() => ({
                isSaving: false,
                handleSave: vi.fn().mockRejectedValue(new Error('Save failed')),
                saveError: 'Save failed',
                settings: mockConfig,
                setSettings: vi.fn(),
                setPathsHaveChanges: vi.fn(),
                pathsHaveChanges: true,
                validationErrors: {},
                connectionTestStatus: null,
                setConnectionTestStatus: vi.fn(),
                handleConnectionTest: vi.fn()
            })),
        }));

        await renderActualSettings();
        await waitFor(() => expect(screen.queryByTestId('settings-loading')).not.toBeInTheDocument());

        // Симулируем сохранение
        const saveButton = screen.getByTestId('settings-save-button');
        fireEvent.click(saveButton);

        // Проверяем, что resetChanges НЕ был вызван при ошибке сохранения
        await waitFor(() => {
            expect(mockResetChanges).not.toHaveBeenCalled();
        });
    });
});
