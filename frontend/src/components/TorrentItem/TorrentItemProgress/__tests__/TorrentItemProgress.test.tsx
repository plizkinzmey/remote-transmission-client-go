import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TorrentItemProgress, TorrentItemProgressProps } from '..'; // Import from index
import * as StatusUtils from '../../../../utils/torrentStatus';

// Mocks
vi.mock('../../../../utils/torrentStatus');
vi.mock('@radix-ui/themes', () => ({
    // Mock the Progress component
    Progress: ({ value, color, 'data-testid': dataTestId, ...props }: any) => (
        <div data-testid={dataTestId} data-value={value} data-color={color} {...props} />
    ),
}));
vi.mock('../TorrentItemProgress.module.css', () => ({
    default: {
        progressWrapper: 'progress-wrapper-mock',
    },
}));

// Mock implementations
// Use ReturnType or rely on inference instead of vi.Mock
const mockGetStatusData = StatusUtils.getStatusData as ReturnType<typeof vi.fn>;

const defaultProps: TorrentItemProgressProps = {
    progress: 75.2,
    status: 'downloading',
};

describe('TorrentItemProgress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default mock return value for getStatusData
        mockGetStatusData.mockReturnValue({ color: 'blue', icon: null });
    });

    it('renders correctly with default props', () => {
        render(<TorrentItemProgress {...defaultProps} />);

        const progressElement = screen.getByTestId('torrent-progress');
        expect(progressElement).toBeInTheDocument();

        // Check if getStatusData was called with the correct status
        expect(mockGetStatusData).toHaveBeenCalledWith(defaultProps.status);

        // Check if the Progress component received the correct props
        expect(progressElement).toHaveAttribute('data-value', String(defaultProps.progress));
        expect(progressElement).toHaveAttribute('data-color', 'blue'); // Default mock color
        expect(progressElement).toHaveClass('progress-wrapper-mock');
    });

    it('updates color based on status', () => {
        // Override mock return value for this specific test
        mockGetStatusData.mockReturnValue({ color: 'green', icon: null });
        render(<TorrentItemProgress {...defaultProps} status="seeding" />);

        const progressElement = screen.getByTestId('torrent-progress');
        expect(mockGetStatusData).toHaveBeenCalledWith('seeding');
        expect(progressElement).toHaveAttribute('data-color', 'green');
    });

    it('renders with different progress value', () => {
        const newProgress = 100;
        render(<TorrentItemProgress {...defaultProps} progress={newProgress} />);

        const progressElement = screen.getByTestId('torrent-progress');
        expect(progressElement).toHaveAttribute('data-value', String(newProgress));
    });
});
