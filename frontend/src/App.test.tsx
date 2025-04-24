import { render, screen, act } from "@testing-library/react"; // Добавляем act
import App from "./App";
import * as hooks from "@hooks/torrent";
import { vi } from "vitest"; // Импортируем vi
import { TorrentList, TorrentListProps } from "@/components/TorrentList"; // Импортируем для мокирования и тип пропсов
import { Header, HeaderProps } from "@/components/Header"; // Импортируем для мокирования и тип пропсов
import { AddTorrent, AddTorrentProps } from "@/components/AddTorrent"; // Импортируем для мокирования и тип пропсов
import { useModals } from "@hooks/useModals"; // Импортируем для мокирования useModals
import { useBulkOperations } from "@/hooks/useBulkOperations"; // Импортируем для мокирования useBulkOperations
import { useFilteredTorrents } from "@/components/TorrentList/hooks/useFilteredTorrents"; // Импортируем недостающие хуки
import { useLocalization } from "@/contexts/LocalizationContext"; // Импортируем недостающие хуки

// Мокируем все хуки, используемые в App
vi.mock("@hooks/torrent", async (importOriginal) => {
    const actual = await importOriginal<typeof hooks>();
    return {
        ...actual, // Сохраняем реальные экспорты, если они не мокируются ниже
        useConnectionManager: vi.fn(),
        useConfigManager: vi.fn(),
        useTorrentList: vi.fn(),
        useSessionStats: vi.fn(),
        useTorrentSelection: vi.fn(() => ({
            selectedTorrents: new Set(),
            hasSelectedTorrents: false,
            handleTorrentSelect: vi.fn(),
            handleSelectAll: vi.fn(),
            clearSelection: vi.fn(),
        })),
        useTorrentActions: vi.fn(() => ({
            addTorrent: vi.fn(),
            addTorrentFile: vi.fn(),
            removeTorrent: vi.fn(),
            startTorrents: vi.fn(),
            stopTorrents: vi.fn(),
            setSpeedLimit: vi.fn(),
            verifyTorrent: vi.fn(),
        })),
    };
});
vi.mock("@hooks/useModals", () => ({
    useModals: vi.fn(() => ({
        showSettings: false,
        showAddTorrent: false,
        torrentFilePath: null,
        isFirstStart: false,
        torrentFileData: null,
        checkFirstStart: vi.fn(),
        handleSuccessfulSettingsSave: vi.fn(),
        openSettings: vi.fn(),
        closeSettings: vi.fn(),
        openAddTorrent: vi.fn(),
        closeAddTorrent: vi.fn(),
        handleTorrentFileDrop: vi.fn(),
    })),
}));
vi.mock("@/hooks/useBulkOperations", () => ({
    useBulkOperations: vi.fn(() => ({
        bulkOperations: { start: false, stop: false, remove: false, speedLimit: false },
        handleStartSelected: vi.fn(),
        handleStopSelected: vi.fn(),
        handleRemoveSelected: vi.fn(),
        handleSetSpeedLimit: vi.fn(),
    })),
})); // Добавляем недостающую скобку
vi.mock("@/components/TorrentList/hooks/useFilteredTorrents", () => ({
    useFilteredTorrents: vi.fn(() => ({
        searchTerm: "",
        setSearchTerm: vi.fn(),
        statusFilter: null, // Исправляем тип на null
        setStatusFilter: vi.fn(),
        filteredTorrents: [],
    })),
}));
vi.mock("@/contexts/LocalizationContext", () => ({
    useLocalization: vi.fn(() => ({
        // Обновляем сигнатуру t
        t: (key: string, params?: string | string[] | Record<string, string> | undefined) => {
            // Простая реализация для тестов, можно расширить при необходимости
            if (typeof params === 'string') return `${key}_${params}`;
            return key;
        },
        currentLanguage: "en",
        availableLanguages: [],
        setLanguage: vi.fn(),
    })),
}));

// Мокируем дочерние компоненты, чтобы получить доступ к их пропсам
vi.mock("@/components/TorrentList", () => ({
    TorrentList: vi.fn(() => <div data-testid="torrent-list-mock"></div>),
}));
vi.mock("@/components/Header", () => ({
    Header: vi.fn(() => <div data-testid="header-mock"></div>),
}));
vi.mock("@/components/AddTorrent", () => ({
    AddTorrent: vi.fn(() => <div data-testid="add-torrent-mock"></div>),
}));

// Базовые моки для хуков
const defaultUseConnectionManagerMock = {
    isInitialized: true,
    isLoading: false,
    isReconnecting: false,
    error: null,
    initialConfig: null,
    connect: vi.fn(),
    reconnect: vi.fn(),
    setConnectionError: vi.fn(),
    setIsReconnectingState: vi.fn(),
};

const defaultUseConfigManagerMock = {
    config: null,
    isSettingsSaving: false,
    error: null,
    handleSettingsSave: vi.fn(),
    setConfig: vi.fn(),
};

const defaultUseTorrentListMock = {
    torrents: [],
    isLoading: false,
    error: null,
    refreshTorrents: vi.fn(),
};

const defaultUseSessionStatsMock = {
    sessionStats: null,
    error: null,
    refreshSessionStats: vi.fn(),
};

const defaultUseModalsMock = {
    showSettings: false,
    showAddTorrent: false,
    torrentFilePath: null,
    isFirstStart: false,
    torrentFileData: null,
    checkFirstStart: vi.fn(),
    handleSuccessfulSettingsSave: vi.fn(),
    openSettings: vi.fn(),
    closeSettings: vi.fn(),
    openAddTorrent: vi.fn(),
    closeAddTorrent: vi.fn(),
    handleTorrentFileDrop: vi.fn(),
};

// Используйте vi вместо jest для vitest-проекта
describe("App error handling", () => {
    beforeEach(() => {
        // Сбрасываем моки перед каждым тестом
        vi.mocked(hooks.useConnectionManager).mockReturnValue(defaultUseConnectionManagerMock);
        vi.mocked(hooks.useConfigManager).mockReturnValue(defaultUseConfigManagerMock);
        vi.mocked(hooks.useTorrentList).mockReturnValue(defaultUseTorrentListMock);
        vi.mocked(hooks.useSessionStats).mockReturnValue(defaultUseSessionStatsMock);
    });

    it("sets app error from connectionError", () => {
        vi.mocked(hooks.useConnectionManager).mockReturnValue({
            ...defaultUseConnectionManagerMock,
            error: "connection error", // Устанавливаем ошибку здесь
        });
        render(<App />);
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });

    it("sets app error from configError", () => {
        vi.mocked(hooks.useConfigManager).mockReturnValue({
            ...defaultUseConfigManagerMock,
            error: "config error", // Устанавливаем ошибку здесь
        });
        render(<App />);
        expect(screen.getByText(/config error/i)).toBeInTheDocument();
    });

    it("sets app error from torrentListError and triggers reconnect", () => {
        const setIsReconnectingState = vi.fn();
        const setConnectionError = vi.fn();
        vi.mocked(hooks.useConnectionManager).mockReturnValue({
            ...defaultUseConnectionManagerMock,
            setIsReconnectingState, // Передаем мокированные функции
            setConnectionError,
        });
        vi.mocked(hooks.useTorrentList).mockReturnValue({
            ...defaultUseTorrentListMock,
            error: "torrent list error", // Устанавливаем ошибку здесь
        });
        render(<App />);
        expect(screen.getByText(/torrent list error/i)).toBeInTheDocument();
        expect(setIsReconnectingState).toHaveBeenCalledWith(true);
        expect(setConnectionError).toHaveBeenCalled(); // Проверяем вызов setConnectionError
    });

    it("sets app error from sessionStatsError", () => {
        vi.mocked(hooks.useSessionStats).mockReturnValue({
            ...defaultUseSessionStatsMock,
            error: "stats error", // Устанавливаем ошибку здесь
        });
        render(<App />);
        expect(screen.getByText(/stats error/i)).toBeInTheDocument();
    });
});

// Аналогично для обработчиков-адаптеров
describe("App action adapters", () => {
    let startTorrentsMock: ReturnType<typeof vi.fn>;
    let stopTorrentsMock: ReturnType<typeof vi.fn>;
    let removeTorrentMock: ReturnType<typeof vi.fn>;
    let verifyTorrentMock: ReturnType<typeof vi.fn>;
    let addTorrentMock: ReturnType<typeof vi.fn>;
    let addTorrentFileMock: ReturnType<typeof vi.fn>; // Добавляем мок для addTorrentFile
    let handleBulkSetSpeedLimitMock: ReturnType<typeof vi.fn>;
    let openAddTorrentMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Сбрасываем моки перед каждым тестом
        vi.clearAllMocks(); // Очищаем все моки

        // Настраиваем моки хуков для этого блока тестов
        startTorrentsMock = vi.fn();
        stopTorrentsMock = vi.fn();
        removeTorrentMock = vi.fn();
        verifyTorrentMock = vi.fn();
        addTorrentMock = vi.fn().mockResolvedValue(true); // Мокируем успешное добавление
        addTorrentFileMock = vi.fn().mockResolvedValue(true); // Мокируем успешное добавление файла
        handleBulkSetSpeedLimitMock = vi.fn();
        openAddTorrentMock = vi.fn();

        vi.mocked(hooks.useConnectionManager).mockReturnValue(defaultUseConnectionManagerMock);
        vi.mocked(hooks.useConfigManager).mockReturnValue(defaultUseConfigManagerMock);
        vi.mocked(hooks.useTorrentList).mockReturnValue(defaultUseTorrentListMock);
        vi.mocked(hooks.useSessionStats).mockReturnValue(defaultUseSessionStatsMock);
        vi.mocked(hooks.useTorrentSelection).mockReturnValue({
            selectedTorrents: new Set(),
            hasSelectedTorrents: false,
            handleTorrentSelect: vi.fn(),
            handleSelectAll: vi.fn(),
            clearSelection: vi.fn(),
        });
        vi.mocked(hooks.useTorrentActions).mockReturnValue({
            addTorrent: addTorrentMock,
            addTorrentFile: addTorrentFileMock, // Используем мок
            removeTorrent: removeTorrentMock,
            startTorrents: startTorrentsMock,
            stopTorrents: stopTorrentsMock,
            setSpeedLimit: vi.fn(),
            verifyTorrent: verifyTorrentMock,
        });
        vi.mocked(useModals).mockReturnValue(defaultUseModalsMock); // Используем default mock
        vi.mocked(useBulkOperations).mockReturnValue({
            bulkOperations: { start: false, stop: false, remove: false, speedLimit: false },
            error: null, // Добавляем недостающее свойство error
            handleStartSelected: vi.fn(),
            handleStopSelected: vi.fn(),
            handleRemoveSelected: vi.fn(),
            handleSetSpeedLimit: handleBulkSetSpeedLimitMock,
        });
        vi.mocked(useFilteredTorrents).mockReturnValue({
            searchTerm: "",
            setSearchTerm: vi.fn(),
            statusFilter: null, // Исправляем тип на null
            setStatusFilter: vi.fn(),
            filteredTorrents: [],
        });
        vi.mocked(useLocalization).mockReturnValue({
            t: (key: string, params?: string | string[] | Record<string, string> | undefined) => {
                if (typeof params === 'string') return `${key}_${params}`;
                return key;
            },
            currentLanguage: "en",
            isLoading: false, // Добавляем недостающее свойство isLoading
            availableLanguages: [],
            setLanguage: vi.fn(),
        });

        // Мокируем дочерние компоненты заново перед каждым тестом
        vi.mocked(TorrentList).mockClear();
        vi.mocked(Header).mockClear();
        vi.mocked(AddTorrent).mockClear();
    });

    it("calls removeTorrent via adapter", () => {
        render(<App />);
        // Явно указываем тип пропсов
        const torrentListProps = vi.mocked(TorrentList).mock.calls[0][0] as TorrentListProps;
        act(() => {
            torrentListProps.onRemove(1, true);
        });
        expect(removeTorrentMock).toHaveBeenCalledWith(1, true);
    });

    it("calls startTorrents via adapter", () => {
        render(<App />);
        const torrentListProps = vi.mocked(TorrentList).mock.calls[0][0] as TorrentListProps;
        act(() => {
            torrentListProps.onStart(5);
        });
        expect(startTorrentsMock).toHaveBeenCalledWith([5]);
    });

    it("calls stopTorrents via adapter", () => {
        render(<App />);
        const torrentListProps = vi.mocked(TorrentList).mock.calls[0][0] as TorrentListProps;
        act(() => {
            torrentListProps.onStop(10);
        });
        expect(stopTorrentsMock).toHaveBeenCalledWith([10]);
    });

    it("calls verifyTorrent via adapter", () => {
        render(<App />);
        const torrentListProps = vi.mocked(TorrentList).mock.calls[0][0] as TorrentListProps;
        act(() => {
            // Проверяем, что onVerify существует перед вызовом
            if (torrentListProps.onVerify) {
                torrentListProps.onVerify(15);
            }
        });
        expect(verifyTorrentMock).toHaveBeenCalledWith(15);
    });

    it("calls addTorrent via adapter when AddTorrent modal calls onAdd", async () => {
        // Создаем специфичный мок для этого теста
        const currentCloseAddTorrentMock = vi.fn();
        vi.mocked(useModals).mockReturnValue({
            ...defaultUseModalsMock,
            showAddTorrent: true,
            openAddTorrent: openAddTorrentMock, // Можно оставить глобальный, если не проверяется
            closeAddTorrent: currentCloseAddTorrentMock, // Используем специфичный мок
        });
        // Убедимся, что мок действия возвращает true
        addTorrentMock.mockResolvedValue(true);

        render(<App />);

        expect(screen.getByTestId("add-torrent-mock")).toBeInTheDocument();
        const addTorrentProps = vi.mocked(AddTorrent).mock.calls[0][0] as AddTorrentProps;

        await act(async () => {
            await addTorrentProps.onAdd("magnet:?xt=urn:btih:123", "/downloads");
        });

        expect(addTorrentMock).toHaveBeenCalledWith("magnet:?xt=urn:btih:123", "/downloads");
        // Проверяем специфичный мок
        expect(currentCloseAddTorrentMock).toHaveBeenCalled();
    });

    it("calls addTorrentFile via adapter when AddTorrent modal calls onAddFile", async () => {
        // Создаем специфичный мок для этого теста
        const currentCloseAddTorrentMock = vi.fn();
        vi.mocked(useModals).mockReturnValue({
            ...defaultUseModalsMock,
            showAddTorrent: true,
            openAddTorrent: openAddTorrentMock, // Можно оставить глобальный, если не проверяется
            closeAddTorrent: currentCloseAddTorrentMock, // Используем специфичный мок
        });
        // Убедимся, что мок действия возвращает true
        addTorrentFileMock.mockResolvedValue(true);

        render(<App />);

        expect(screen.getByTestId("add-torrent-mock")).toBeInTheDocument();
        const addTorrentProps = vi.mocked(AddTorrent).mock.calls[0][0] as AddTorrentProps;
        const base64Content = "dGVzdCBjb250ZW50";

        await act(async () => {
            if (addTorrentProps.onAddFile) {
                await addTorrentProps.onAddFile(base64Content, "/downloads");
            }
        });

        expect(addTorrentFileMock).toHaveBeenCalledWith(base64Content, "/downloads");
        // Проверяем специфичный мок
        expect(currentCloseAddTorrentMock).toHaveBeenCalled();
    });

    it("calls handleBulkSetSpeedLimit via Header callback", () => {
        render(<App />);
        // Явно указываем тип пропсов
        const headerProps = vi.mocked(Header).mock.calls[0][0] as HeaderProps;
        act(() => {
            headerProps.onSetSpeedLimit(true); // Симулируем включение медленного режима
        });
        expect(handleBulkSetSpeedLimitMock).toHaveBeenCalledWith(true);

        act(() => {
            headerProps.onSetSpeedLimit(false); // Симулируем выключение медленного режима
        });
        expect(handleBulkSetSpeedLimitMock).toHaveBeenCalledWith(false);
    });

    // ...и так далее для других адаптеров...
});
