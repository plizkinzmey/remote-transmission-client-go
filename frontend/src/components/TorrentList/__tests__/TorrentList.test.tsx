import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TorrentItem } from '../../TorrentItem';
import { TorrentList } from '../TorrentList';
import { Theme } from '@radix-ui/themes';
import { useLocalization } from '@contexts/LocalizationContext';
import { TorrentData as Torrent, TorrentListProps } from '../types'; // Assuming Torrent type is defined here. Added TorrentListProps
import { StatusType } from "@utils/torrentStatus"; // Импортируем StatusType

// --- Mocks ---
// Mock TorrentItem component
// Correct the path in vi.mock to match the actual component location
vi.mock('../../TorrentItem', () => ({
    // Keep the mock implementation simple for prop checking,
    // but be aware it might not render as expected in filtering tests if the mock isn't fully applied.
    TorrentItem: vi.fn(({ 'data-testid': dataTestId, ...props }) => (
        <div data-testid={dataTestId} {...props}>
            Mocked TorrentItem: {props.name}
        </div>
    )),
}));

// Mock LocalizationContext
vi.mock('../../../contexts/LocalizationContext');
// Rename mockT to translateMock for clarity
const translateMock = vi.fn((key) => key);
const mockedUseLocalization = vi.mocked(useLocalization);

// Mock LoadingSpinner
vi.mock('../../LoadingSpinner', () => ({
    LoadingSpinner: vi.fn(({ 'data-testid': dataTestId }) => <div data-testid={dataTestId}>Mocked LoadingSpinner</div>),
}));

// Mock CSS Modules
vi.mock('../TorrentList.module.css', () => ({
    default: {
        torrentListContainer: 'torrent-list-container-mock',
        torrentList: 'torrent-list-mock',
        loadingContainer: 'loading-container-mock',
        loadingText: 'loading-text-mock',
        emptyState: 'empty-state-mock',
    },
}));

// --- Test Data & Setup ---
export const mockTorrents: Torrent[] = [
    {
        ID: 1,
        Name: "Torrent 1",
        Status: "downloading" as StatusType, // <-- Приводим к StatusType
        Progress: 50,
        Size: 1024 * 1024 * 100, // 100 MB
        SizeFormatted: "100 MB",
        UploadRatio: 1.5,
        SeedsConnected: 10,
        SeedsTotal: 20,
        PeersConnected: 5,
        PeersTotal: 10,
        UploadedBytes: 1024 * 1024 * 50, // 50 MB
        UploadedFormatted: "50 MB",
        DownloadSpeed: 1024 * 1024, // 1 MB/s
        UploadSpeed: 1024 * 512, // 512 KB/s
        DownloadSpeedFormatted: "1 MB/s",
        UploadSpeedFormatted: "512 KB/s",
        IsSlowMode: false,
    },
    {
        ID: 2,
        Name: "Torrent 2 - Seeding",
        Status: "seeding" as StatusType, // <-- Приводим к StatusType
        Progress: 100,
        Size: 1024 * 1024 * 200, // 200 MB
        SizeFormatted: "200 MB",
        UploadRatio: 2.1,
        SeedsConnected: 15,
        SeedsTotal: 25,
        PeersConnected: 0,
        PeersTotal: 0,
        UploadedBytes: 1024 * 1024 * 420, // 420 MB
        UploadedFormatted: "420 MB",
        DownloadSpeed: 0,
        UploadSpeed: 1024 * 100, // 100 KB/s
        DownloadSpeedFormatted: "0 B/s",
        UploadSpeedFormatted: "100 KB/s",
        IsSlowMode: true,
    },
    {
        ID: 3,
        Name: "Torrent 3 - Stopped",
        Status: "stopped" as StatusType, // <-- Приводим к StatusType
        Progress: 75,
        Size: 1024 * 1024 * 50, // 50 MB
        SizeFormatted: "50 MB",
        UploadRatio: 0.8,
        SeedsConnected: 0,
        SeedsTotal: 10,
        PeersConnected: 0,
        PeersTotal: 5,
        UploadedBytes: 1024 * 1024 * 40, // 40 MB
        UploadedFormatted: "40 MB",
        DownloadSpeed: 0,
        UploadSpeed: 0,
        DownloadSpeedFormatted: "0 B/s",
        UploadSpeedFormatted: "0 B/s",
        IsSlowMode: false,
    },
];

const defaultProps: TorrentListProps = {
    torrents: mockTorrents,
    searchTerm: '',
    selectedTorrents: new Set<number>(),
    onSelect: vi.fn(),
    onRemove: vi.fn(),
    onStart: vi.fn(),
    onStop: vi.fn(),
    onVerify: vi.fn(),
    isLoading: false,
    isReconnecting: false,
    onSetSpeedLimit: vi.fn(),
};

// Use the imported TorrentItem with vi.mocked
const torrentItemMock = vi.mocked(TorrentItem);

describe('TorrentList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Provide the mock 't' function (now translateMock)
        mockedUseLocalization.mockReturnValue({ t: translateMock } as unknown as ReturnType<typeof useLocalization>);
    });

    it('renders loading spinner when isLoading is true and not reconnecting', () => {
        render(<TorrentList {...defaultProps} isLoading={true} />);
        expect(screen.getByTestId('torrent-list-loading')).toBeInTheDocument();
        expect(screen.getByText('torrents.loading')).toBeInTheDocument();
        // Update usage of mockT to translateMock
        expect(translateMock).toHaveBeenCalledWith('torrents.loading');
        expect(screen.queryByTestId('torrent-list-empty')).not.toBeInTheDocument();
        expect(torrentItemMock).not.toHaveBeenCalled();
    });

    it('renders nothing when isReconnecting is true', () => {
        render(<TorrentList {...defaultProps} isReconnecting={true} isLoading={true} />);
        // Check if the main container is empty or only contains the outer structure
        const listContainer = screen.getByTestId('torrent-list-container');
        // Check that specific content elements are not present
        expect(listContainer.querySelector('[data-testid="torrent-list-loading"]')).not.toBeInTheDocument();
        expect(listContainer.querySelector('[data-testid="torrent-list-empty"]')).not.toBeInTheDocument();
        expect(torrentItemMock).not.toHaveBeenCalled(); // Ensure no items are rendered
    });

    it('renders empty state message when no torrents are provided and not loading/reconnecting', () => {
        render(<TorrentList {...defaultProps} torrents={[]} />);
        expect(screen.getByTestId('torrent-list-empty')).toBeInTheDocument();
        expect(screen.getByText('torrents.noTorrents')).toBeInTheDocument();
        // Update usage of mockT to translateMock
        expect(translateMock).toHaveBeenCalledWith('torrents.noTorrents');
        expect(screen.queryByTestId('torrent-list-loading')).not.toBeInTheDocument();
        expect(torrentItemMock).not.toHaveBeenCalled();
    });

    it('renders "no torrents found" message when search yields no results', () => {
        // Test now assumes the parent component handles filtering.
        // Pass an empty array to simulate no results after filtering.
        // Create a fresh props object for this test
        const props = {
            ...defaultProps,
            torrents: [],
            searchTerm: "nonexistent"
        };
        render(<TorrentList {...props} />);
        expect(screen.getByTestId('torrent-list-empty')).toBeInTheDocument();
        expect(screen.getByText('torrents.noTorrentsFound')).toBeInTheDocument();
        // Update usage of mockT to translateMock
        expect(translateMock).toHaveBeenCalledWith('torrents.noTorrentsFound');
        expect(screen.queryByTestId('torrent-list-loading')).not.toBeInTheDocument();
        expect(torrentItemMock).not.toHaveBeenCalled();
    });

    it('renders list of TorrentItems when torrents are provided', () => {
        render(<TorrentList {...defaultProps} />);

        // Verify the component didn't render loading or empty states
        expect(screen.queryByTestId('torrent-list-loading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('torrent-list-empty')).not.toBeInTheDocument();

        // Check that each expected torrent item was rendered with the correct basic props
        // and that its mocked content is visible
        mockTorrents.forEach(torrent => {
            expect(torrentItemMock).toHaveBeenCalledWith(
                expect.objectContaining({ id: torrent.ID }),
                {}
            );
            // Check if the mocked item's text content is rendered
            expect(screen.getByText(`Mocked TorrentItem: ${torrent.Name}`)).toBeInTheDocument();
        });

        // Assert the number of rendered TorrentItem elements by checking the rendered text
        // This accommodates potential double renders in StrictMode
        const renderedItems = screen.getAllByText(/Mocked TorrentItem:/);
        expect(renderedItems).toHaveLength(mockTorrents.length);
    });

    it('filters torrents based on searchTerm', () => {
        // This test is no longer relevant as TorrentList doesn't filter internally.
        // The parent component using useFilteredTorrents is responsible for filtering.
        // We'll test that it renders the torrents it receives.
        const filtered = [mockTorrents[1]]; // Simulate parent filtering for "Torrent 2 - Seeding"
        // Create a fresh props object for this test
        const props = {
            ...defaultProps,
            torrents: filtered,
            searchTerm: "Torrent 2 - Seeding" // Update search term to match data
        };
        render(<TorrentList {...props} />);

        // Check that TorrentItem was called exactly once for the filtered torrent
        expect(torrentItemMock).toHaveBeenCalledTimes(1);

        // Check that it was called with the props for 'Torrent 2 - Seeding'
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 2,
                name: 'Torrent 2 - Seeding', // <-- Corrected name expectation
            }),
            {} // Second argument for context
        );

        // Verify the rendered output for the filtered item using DOM query
        expect(screen.getByText('Mocked TorrentItem: Torrent 2 - Seeding')).toBeInTheDocument(); // <-- Corrected text expectation
        // Verify that the other items are not rendered using DOM query
        expect(screen.queryByText('Mocked TorrentItem: Torrent 1')).not.toBeInTheDocument(); // <-- Corrected name
        expect(screen.queryByText('Mocked TorrentItem: Torrent 3 - Stopped')).not.toBeInTheDocument(); // <-- Corrected name
    });

    it('passes correct props to TorrentItem', () => {
        const selectedTorrents = new Set([mockTorrents[1].ID]); // Select Torrent B (ID 2)
        render(<TorrentList {...defaultProps} selectedTorrents={selectedTorrents} />);

        // Check props for the first torrent (Torrent A, ID 1, not selected)
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTorrents[0].ID,
                name: mockTorrents[0].Name,
                status: mockTorrents[0].Status,
                progress: mockTorrents[0].Progress,
                sizeFormatted: mockTorrents[0].SizeFormatted,
                uploadRatio: mockTorrents[0].UploadRatio,
                seedsConnected: mockTorrents[0].SeedsConnected,
                seedsTotal: mockTorrents[0].SeedsTotal,
                peersConnected: mockTorrents[0].PeersConnected,
                peersTotal: mockTorrents[0].PeersTotal,
                uploadedFormatted: mockTorrents[0].UploadedFormatted,
                downloadSpeedFormatted: mockTorrents[0].DownloadSpeedFormatted,
                uploadSpeedFormatted: mockTorrents[0].UploadSpeedFormatted,
                selected: false, // Explicitly check false
                isSelected: false, // Check that isSelected is false
                onSelect: defaultProps.onSelect,
                onRemove: defaultProps.onRemove,
                onStart: defaultProps.onStart,
                onStop: defaultProps.onStop,
                onVerify: defaultProps.onVerify,
                onSetSpeedLimit: defaultProps.onSetSpeedLimit,
                isSlowMode: mockTorrents[0].IsSlowMode,
            }),
            {} // Second argument for context
        );

        // Check props for the second torrent (Torrent B, ID 2, selected)
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTorrents[1].ID,
                name: mockTorrents[1].Name,
                status: mockTorrents[1].Status,
                progress: mockTorrents[1].Progress,
                sizeFormatted: mockTorrents[1].SizeFormatted,
                uploadRatio: mockTorrents[1].UploadRatio,
                seedsConnected: mockTorrents[1].SeedsConnected,
                seedsTotal: mockTorrents[1].SeedsTotal,
                peersConnected: mockTorrents[1].PeersConnected,
                peersTotal: mockTorrents[1].PeersTotal,
                uploadedFormatted: mockTorrents[1].UploadedFormatted,
                downloadSpeedFormatted: mockTorrents[1].DownloadSpeedFormatted,
                uploadSpeedFormatted: mockTorrents[1].UploadSpeedFormatted,
                selected: true, // Explicitly check true
                isSelected: true, // Check that isSelected is true
                onSelect: defaultProps.onSelect,
                onRemove: defaultProps.onRemove,
                onStart: defaultProps.onStart,
                onStop: defaultProps.onStop,
                onVerify: defaultProps.onVerify,
                onSetSpeedLimit: defaultProps.onSetSpeedLimit,
                isSlowMode: mockTorrents[1].IsSlowMode,
            }),
            {} // Second argument for context
        );

        // Check props for the third torrent (Torrent C, ID 3, not selected)
        // Ensure all relevant props are checked consistently
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTorrents[2].ID,
                name: mockTorrents[2].Name,
                status: mockTorrents[2].Status,
                progress: mockTorrents[2].Progress,
                sizeFormatted: mockTorrents[2].SizeFormatted,
                uploadRatio: mockTorrents[2].UploadRatio,
                seedsConnected: mockTorrents[2].SeedsConnected,
                seedsTotal: mockTorrents[2].SeedsTotal,
                peersConnected: mockTorrents[2].PeersConnected,
                peersTotal: mockTorrents[2].PeersTotal,
                uploadedFormatted: mockTorrents[2].UploadedFormatted,
                downloadSpeedFormatted: mockTorrents[2].DownloadSpeedFormatted,
                uploadSpeedFormatted: mockTorrents[2].UploadSpeedFormatted,
                selected: false, // Explicitly check false
                isSelected: false, // Check that isSelected is false
                onSelect: defaultProps.onSelect,
                onRemove: defaultProps.onRemove,
                onStart: defaultProps.onStart,
                onStop: defaultProps.onStop,
                onVerify: defaultProps.onVerify,
                onSetSpeedLimit: defaultProps.onSetSpeedLimit,
                isSlowMode: mockTorrents[2].IsSlowMode,
            }),
            {} // Second argument for context
        );
    });

    // Отдельный тест для проверки isSelected при выборе торрентов
    it('sets isSelected correctly when torrents are selected', () => {
        const selectedTorrents = new Set([mockTorrents[0].ID, mockTorrents[2].ID]); // Выбираем два торрента
        render(<TorrentList {...defaultProps} selectedTorrents={selectedTorrents} />);

        // Проверяем первый торрент (выбран)
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTorrents[0].ID,
                selected: true,
                isSelected: true,
            }),
            expect.anything()
        );

        // Проверяем второй торрент (не выбран)
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTorrents[1].ID,
                selected: false,
                isSelected: false,
            }),
            expect.anything()
        );

        // Проверяем третий торрент (выбран)
        expect(torrentItemMock).toHaveBeenCalledWith(
            expect.objectContaining({
                id: mockTorrents[2].ID,
                selected: true,
                isSelected: true,
            }),
            expect.anything()
        );
    });
});
