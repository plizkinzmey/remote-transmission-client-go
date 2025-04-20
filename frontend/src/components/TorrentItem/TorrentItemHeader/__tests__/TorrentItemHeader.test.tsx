import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TorrentItemHeader } from '../TorrentItemHeader';
import { Theme } from '@radix-ui/themes';
import { useLocalization } from '@contexts/LocalizationContext';
import * as Formatters from '../../../../utils/formatters';
import * as StatusUtils from '../../../../utils/torrentStatus';

// Mocks
vi.mock('@contexts/LocalizationContext');
vi.mock('../../../../utils/formatters');
vi.mock('../../../../utils/torrentStatus');
vi.mock('@radix-ui/themes', () => ({
    Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Text: ({ children, 'data-testid': dataTestId, ...props }: any) => <span data-testid={dataTestId} {...props}>{children}</span>,
    Badge: ({ children, 'data-testid': dataTestId, ...props }: any) => <span data-testid={dataTestId} {...props}>{children}</span>,
}));
vi.mock('../TorrentItemHeader.module.css', () => ({
    default: {
        textEllipsis: 'text-ellipsis-mock',
    },
}));

// Mock implementations
const mockT = vi.fn((key) => key);
// Use ReturnType or rely on inference instead of vi.Mock
const mockUseLocalization = useLocalization as ReturnType<typeof vi.fn>;
const mockFormatRatio = Formatters.formatRatio as ReturnType<typeof vi.fn>;
const mockGetStatusData = StatusUtils.getStatusData as ReturnType<typeof vi.fn>;

const defaultProps: TorrentItemHeaderProps = {
    name: 'Test Torrent Name',
    status: 'downloading',
    progress: 55.5,
    uploadRatio: 1.234,
};

describe('TorrentItemHeader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseLocalization.mockReturnValue({ t: mockT });
        // Add type annotation for ratio
        mockFormatRatio.mockImplementation((ratio: number) => ratio.toFixed(2));
        mockGetStatusData.mockReturnValue({ color: 'blue', icon: null }); // Mock return value
    });

    it('renders correctly with default props', () => {
        render(<TorrentItemHeader {...defaultProps} />);

        // Check name
        const nameElement = screen.getByTestId('torrent-header-name');
        expect(nameElement).toBeInTheDocument();
        expect(nameElement).toHaveTextContent(defaultProps.name);
        expect(nameElement).toHaveAttribute('title', defaultProps.name);
        expect(nameElement).toHaveClass('text-ellipsis-mock');

        // Check ratio
        const ratioElement = screen.getByTestId('torrent-header-ratio');
        expect(ratioElement).toBeInTheDocument();
        expect(mockT).toHaveBeenCalledWith('torrent.ratio');
        expect(mockFormatRatio).toHaveBeenCalledWith(defaultProps.uploadRatio);
        expect(ratioElement).toHaveTextContent(`torrent.ratio: ${defaultProps.uploadRatio.toFixed(2)}`);
        expect(ratioElement).toHaveAttribute('title', 'torrent.uploadRatio');

        // Check status
        const statusElement = screen.getByTestId('torrent-header-status');
        expect(statusElement).toBeInTheDocument();
        expect(mockGetStatusData).toHaveBeenCalledWith(defaultProps.status);
        expect(mockT).toHaveBeenCalledWith(`torrent.status.${defaultProps.status}`);
        expect(statusElement).toHaveTextContent(`torrent.status.${defaultProps.status}`);
        expect(statusElement).toHaveAttribute('color', 'blue');

        // Check progress
        const progressElement = screen.getByTestId('torrent-header-progress');
        expect(progressElement).toBeInTheDocument();
        expect(progressElement).toHaveTextContent(`${defaultProps.progress.toFixed(1)}%`);
    });

    it('renders correctly with different status', () => {
        mockGetStatusData.mockReturnValue({ color: 'green', icon: null });
        render(<TorrentItemHeader {...defaultProps} status="seeding" progress={100} />);

        const statusElement = screen.getByTestId('torrent-header-status');
        expect(statusElement).toHaveTextContent('torrent.status.seeding');
        expect(statusElement).toHaveAttribute('color', 'green');

        const progressElement = screen.getByTestId('torrent-header-progress');
        expect(progressElement).toHaveTextContent('100.0%');
    });

    it('formats ratio correctly', () => {
        mockFormatRatio.mockReturnValue('∞'); // Mock specific return for ratio
        render(<TorrentItemHeader {...defaultProps} uploadRatio={-1} />);
        const ratioElement = screen.getByTestId('torrent-header-ratio');
        expect(ratioElement).toHaveTextContent('torrent.ratio: ∞');
    });
});
