import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TorrentItemStats } from '../TorrentItemStats';
import { useLocalization } from '@contexts/LocalizationContext';
import * as Formatters from '../../../../utils/formatters';

// Mocks
vi.mock('@contexts/LocalizationContext');
vi.mock('../../../../utils/formatters');
vi.mock('@radix-ui/themes', () => ({
    Flex: ({ children, 'data-testid': dataTestId, ...props }: any) => <div data-testid={dataTestId} {...props}>{children}</div>,
    Text: ({ children, 'data-testid': dataTestId, ...props }: any) => <span data-testid={dataTestId} {...props}>{children}</span>,
}));
vi.mock('@heroicons/react/24/outline', () => ({
    ArrowDownIcon: ({ 'data-testid': dataTestId, ...props }: any) => <svg data-testid={dataTestId} {...props} />,
    ArrowUpIcon: ({ 'data-testid': dataTestId, ...props }: any) => <svg data-testid={dataTestId} {...props} />,
}));
vi.mock('../TorrentItemStats.module.css', () => ({
    default: {
        downloadIcon: 'download-icon-mock',
        uploadIcon: 'upload-icon-mock',
    },
}));

// Mock implementations
const mockT = vi.fn((key) => key);
const mockedUseLocalization = vi.mocked(useLocalization);
// Correctly type the mock for normalizeValue (takes number, returns number)
const mockedNormalizeValue = vi.mocked(Formatters.normalizeValue);

const defaultProps: TorrentItemStatsProps = {
    sizeFormatted: '1.2 GB',
    seedsConnected: 5,
    seedsTotal: 10,
    peersConnected: 20,
    peersTotal: 30,
    uploadedFormatted: '500 MB',
    downloadSpeedFormatted: '1.5 MB/s',
    uploadSpeedFormatted: '300 KB/s',
};

describe('TorrentItemStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock only the 't' function, casting through unknown first
        mockedUseLocalization.mockReturnValue({ t: mockT } as unknown as ReturnType<typeof useLocalization>);
        // Mock implementation should return a number, matching the original function
        mockedNormalizeValue.mockImplementation((value: number): number => value < 0 ? 0 : value);
    });

    it('renders correctly with default props', () => {
        render(<TorrentItemStats {...defaultProps} />);

        // Check Size
        const sizeStat = screen.getByTestId('torrent-stat-size');
        expect(sizeStat).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith('torrent.size');
        expect(sizeStat).toHaveTextContent(`torrent.size:${defaultProps.sizeFormatted}`);

        // Check Seeds - Assert the final string rendered by the component
        const seedsStat = screen.getByTestId('torrent-stat-seeds');
        expect(seedsStat).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith('torrent.seeds');
        expect(mockedNormalizeValue).toHaveBeenCalledWith(defaultProps.seedsConnected);
        expect(mockedNormalizeValue).toHaveBeenCalledWith(defaultProps.seedsTotal);
        expect(seedsStat).toHaveTextContent(`torrent.seeds:${defaultProps.seedsConnected}/${defaultProps.seedsTotal}`);

        // Check Peers - Assert the final string rendered by the component
        const peersStat = screen.getByTestId('torrent-stat-peers');
        expect(peersStat).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith('torrent.peers');
        expect(mockedNormalizeValue).toHaveBeenCalledWith(defaultProps.peersConnected);
        expect(mockedNormalizeValue).toHaveBeenCalledWith(defaultProps.peersTotal);
        expect(peersStat).toHaveTextContent(`torrent.peers:${defaultProps.peersConnected}/${defaultProps.peersTotal}`);

        // Check Uploaded
        const uploadedStat = screen.getByTestId('torrent-stat-uploaded');
        expect(uploadedStat).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith('torrent.uploaded');
        expect(uploadedStat).toHaveTextContent(`torrent.uploaded:${defaultProps.uploadedFormatted}`);

        // Check Speed Info
        const speedStat = screen.getByTestId('torrent-stat-speed');
        expect(speedStat).toBeInTheDocument();
        expect(screen.getByTestId('download-icon')).toBeInTheDocument();
        expect(screen.getByTestId('download-speed')).toHaveTextContent(defaultProps.downloadSpeedFormatted);
        expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
        expect(screen.getByTestId('upload-speed')).toHaveTextContent(defaultProps.uploadSpeedFormatted);
    });

    it('uses normalizeValue correctly for seeds and peers', () => {
        // Example: Mock normalizeValue to return a modified number
        mockedNormalizeValue.mockImplementation((value: number): number => (value < 0 ? 0 : value) * 10);
        render(<TorrentItemStats {...defaultProps} />);

        // Assert the final string based on the modified numbers returned by the mock
        expect(screen.getByTestId('torrent-stat-seeds')).toHaveTextContent(`torrent.seeds:${defaultProps.seedsConnected * 10}/${defaultProps.seedsTotal * 10}`);
        expect(screen.getByTestId('torrent-stat-peers')).toHaveTextContent(`torrent.peers:${defaultProps.peersConnected * 10}/${defaultProps.peersTotal * 10}`);
    });
});
