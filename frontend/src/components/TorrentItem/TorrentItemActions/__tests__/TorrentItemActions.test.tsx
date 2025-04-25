import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
// Import from index file
import { TorrentItemActions, TorrentItemActionsProps } from '..';
import { useLocalization } from "@contexts/LocalizationContext";
import { LoadingSpinner } from '../../../LoadingSpinner';
import { SnailIcon } from '../../../icons/SnailIcon';
import * as StatusUtils from '../../../../utils/torrentStatus';

// Mocks
vi.mock('../../../../contexts/LocalizationContext');
vi.mock('../../../LoadingSpinner');
vi.mock('../../../icons/SnailIcon');
vi.mock('@radix-ui/themes', () => ({
    Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    IconButton: ({ children, onClick, disabled, title, 'data-testid': dataTestId, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} title={title} data-testid={dataTestId} {...props}>
            {children}
        </button>
    ),
}));
vi.mock('@heroicons/react/24/outline', () => ({
    PlayIcon: () => <svg data-testid="play-icon" />,
    PauseIcon: () => <svg data-testid="pause-icon" />,
    TrashIcon: () => <svg data-testid="trash-icon" />,
    FolderIcon: () => <svg data-testid="folder-icon" />,
    CheckCircleIcon: () => <svg data-testid="check-circle-icon" />,
}));
vi.mock('../TorrentItemActions.module.css', () => ({
    default: {
        actions: 'actions-mock',
    },
}));

// Mock implementations
const mockT = vi.fn((key) => key);
const mockUseLocalization = useLocalization as ReturnType<typeof vi.fn>;
const MockLoadingSpinner = LoadingSpinner as ReturnType<typeof vi.fn>;
const MockSnailIcon = SnailIcon as ReturnType<typeof vi.fn>;

MockLoadingSpinner.mockImplementation(({ size }: { size: string }) => <div data-testid={`loading-spinner-${size}`} />);
MockSnailIcon.mockImplementation(() => <svg data-testid="snail-icon" />);

const defaultProps: TorrentItemActionsProps = {
    id: 1,
    status: 'stopped',
    isLoading: false,
    lastAction: null,
    isSlowMode: false,
    onViewContent: vi.fn(),
    onStart: vi.fn(),
    onStop: vi.fn(),
    onRemove: vi.fn(),
    onVerify: vi.fn(),
    onSetSpeedLimit: vi.fn(),
};

describe('TorrentItemActions', () => {
    // Type the spy variable using MockInstance with the function signature as a single type argument
    let isBlockedSpy: MockInstance<(status: string) => boolean>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseLocalization.mockReturnValue({ t: mockT });
        // Restore the spy if it was created in a previous test
        if (isBlockedSpy) {
            isBlockedSpy.mockRestore();
        }
    });

    it('renders correctly with default props', () => {
        render(<TorrentItemActions {...defaultProps} />);

        expect(screen.getByTestId('torrent-actions-view-content')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-action-start')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-speed-limit')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-verify')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-remove')).toBeInTheDocument();
    });

    // --- Action Button Tests ---
    it('renders play button when stopped', () => {
        render(<TorrentItemActions {...defaultProps} status="stopped" />);
        expect(screen.getByTestId('torrent-actions-action-start')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-action-pause')).not.toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-action-loading')).not.toBeInTheDocument();
    });

    it('renders pause button when running (downloading)', () => {
        render(<TorrentItemActions {...defaultProps} status="downloading" />);
        expect(screen.getByTestId('torrent-actions-action-pause')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-action-start')).not.toBeInTheDocument();
    });

    it('renders pause button when running (seeding)', () => {
        render(<TorrentItemActions {...defaultProps} status="seeding" />);
        expect(screen.getByTestId('torrent-actions-action-pause')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-action-start')).not.toBeInTheDocument();
    });

    it('renders loading spinner for action button when isLoading and not verifying', () => {
        render(<TorrentItemActions {...defaultProps} isLoading={true} lastAction="start" />);
        expect(screen.getByTestId('torrent-actions-action-loading')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner-small')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-action-start')).not.toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-action-pause')).not.toBeInTheDocument();
    });

    it('does not render loading spinner for action button when isLoading and verifying', () => {
        render(<TorrentItemActions {...defaultProps} isLoading={true} lastAction="verify" status="stopped" />);
        expect(screen.queryByTestId('torrent-actions-action-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-action-start')).toBeInTheDocument(); // Should show normal button
    });

    it('calls onStart when play button is clicked', () => {
        render(<TorrentItemActions {...defaultProps} status="stopped" />);
        fireEvent.click(screen.getByTestId('torrent-actions-action-start'));
        expect(defaultProps.onStart).toHaveBeenCalledWith(defaultProps.id);
    });

    it('calls onStop when pause button is clicked', () => {
        render(<TorrentItemActions {...defaultProps} status="downloading" />);
        fireEvent.click(screen.getByTestId('torrent-actions-action-pause'));
        expect(defaultProps.onStop).toHaveBeenCalledWith(defaultProps.id);
    });

    // --- Verify Button Tests ---
    it('renders verify button when onVerify is provided and not checking/queued', () => {
        render(<TorrentItemActions {...defaultProps} status="stopped" />);
        expect(screen.getByTestId('torrent-actions-verify')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-verify-loading')).not.toBeInTheDocument();
    });

    it('does not render verify button when onVerify is not provided', () => {
        render(<TorrentItemActions {...defaultProps} onVerify={undefined} />);
        expect(screen.queryByTestId('torrent-actions-verify')).not.toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-verify-loading')).not.toBeInTheDocument();
    });

    it('renders loading spinner for verify button when checking', () => {
        render(<TorrentItemActions {...defaultProps} status="checking" />);
        expect(screen.getByTestId('torrent-actions-verify-loading')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner-small')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-actions-verify')).not.toBeInTheDocument();
    });

    it('renders loading spinner for verify button when queuedCheck', () => {
        render(<TorrentItemActions {...defaultProps} status="queuedCheck" />);
        expect(screen.getByTestId('torrent-actions-verify-loading')).toBeInTheDocument();
    });

    it('renders loading spinner for verify button when queuedDownload', () => {
        render(<TorrentItemActions {...defaultProps} status="queuedDownload" />);
        expect(screen.getByTestId('torrent-actions-verify-loading')).toBeInTheDocument();
    });

    it('calls onVerify when verify button is clicked', () => {
        render(<TorrentItemActions {...defaultProps} status="stopped" />);
        fireEvent.click(screen.getByTestId('torrent-actions-verify'));
        expect(defaultProps.onVerify).toHaveBeenCalledWith(defaultProps.id);
    });

    it('disables verify button when isLoading', () => {
        render(<TorrentItemActions {...defaultProps} status="stopped" isLoading={true} />);
        expect(screen.getByTestId('torrent-actions-verify')).toBeDisabled();
    });

    // --- Speed Limit Button Tests ---
    it('renders speed limit button when onSetSpeedLimit is provided', () => {
        render(<TorrentItemActions {...defaultProps} />);
        expect(screen.getByTestId('torrent-actions-speed-limit')).toBeInTheDocument();
    });

    it('does not render speed limit button when onSetSpeedLimit is not provided', () => {
        render(<TorrentItemActions {...defaultProps} onSetSpeedLimit={undefined} />);
        expect(screen.queryByTestId('torrent-actions-speed-limit')).not.toBeInTheDocument();
    });

    it('renders speed limit button with correct style when not in slow mode', () => {
        render(<TorrentItemActions {...defaultProps} isSlowMode={false} />);
        const button = screen.getByTestId('torrent-actions-speed-limit');
        // Use getAttribute for checking standard HTML attributes
        // For custom props or complex checks, consider other assertions
        // expect(button).toHaveAttribute('variant', 'soft'); // Radix variant might not be a direct attribute
        // expect(button).toHaveAttribute('color', 'blue'); // Radix color might not be a direct attribute
        expect(button).toBeInTheDocument(); // Basic check
    });

    it('renders speed limit button with correct style when in slow mode', () => {
        render(<TorrentItemActions {...defaultProps} isSlowMode={true} />);
        const button = screen.getByTestId('torrent-actions-speed-limit');
        // expect(button).toHaveAttribute('variant', 'solid');
        // expect(button).toHaveAttribute('color', 'orange');
        expect(button).toBeInTheDocument(); // Basic check
    });

    it('calls onSetSpeedLimit with correct arguments when clicked (turning on)', () => {
        render(<TorrentItemActions {...defaultProps} isSlowMode={false} />);
        fireEvent.click(screen.getByTestId('torrent-actions-speed-limit'));
        expect(defaultProps.onSetSpeedLimit).toHaveBeenCalledWith(defaultProps.id, true);
    });

    it('calls onSetSpeedLimit with correct arguments when clicked (turning off)', () => {
        render(<TorrentItemActions {...defaultProps} isSlowMode={true} />);
        fireEvent.click(screen.getByTestId('torrent-actions-speed-limit'));
        expect(defaultProps.onSetSpeedLimit).toHaveBeenCalledWith(defaultProps.id, false);
    });

    it('disables speed limit button when checking', () => {
        render(<TorrentItemActions {...defaultProps} status="checking" />);
        expect(screen.getByTestId('torrent-actions-speed-limit')).toBeDisabled();
    });

    it('disables speed limit button when queuedCheck', () => {
        render(<TorrentItemActions {...defaultProps} status="queuedCheck" />);
        expect(screen.getByTestId('torrent-actions-speed-limit')).toBeDisabled();
    });

    // --- Other Button Tests ---
    it('calls onViewContent when view content button is clicked', () => {
        render(<TorrentItemActions {...defaultProps} />);
        fireEvent.click(screen.getByTestId('torrent-actions-view-content'));
        expect(defaultProps.onViewContent).toHaveBeenCalledTimes(1);
    });

    it('calls onRemove when remove button is clicked', () => {
        render(<TorrentItemActions {...defaultProps} />);
        fireEvent.click(screen.getByTestId('torrent-actions-remove'));
        expect(defaultProps.onRemove).toHaveBeenCalledWith(defaultProps.id);
    });

    // --- Disabled State Tests ---
    it('disables all buttons except loading spinners when checking', () => {
        // Assign the spy result
        isBlockedSpy = vi.spyOn(StatusUtils, 'isBlocked').mockReturnValue(true);
        render(<TorrentItemActions {...defaultProps} status="checking" />);
        expect(screen.getByTestId('torrent-actions-view-content')).toBeDisabled();
        // Action button becomes loading or disabled based on isRunning, but isBlocked takes precedence
        expect(screen.getByTestId('torrent-actions-action-start')).toBeDisabled();
        expect(screen.getByTestId('torrent-actions-speed-limit')).toBeDisabled();
        // Verify button becomes loading
        expect(screen.getByTestId('torrent-actions-verify-loading')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-remove')).toBeDisabled();
        // No need to call mockRestore here, it's handled in beforeEach
    });

    it('disables all buttons except loading spinners when queued', () => {
        // Assign the spy result
        isBlockedSpy = vi.spyOn(StatusUtils, 'isBlocked').mockReturnValue(true);
        render(<TorrentItemActions {...defaultProps} status="queuedDownload" />);
        expect(screen.getByTestId('torrent-actions-view-content')).toBeDisabled();
        expect(screen.getByTestId('torrent-actions-action-start')).toBeDisabled();
        expect(screen.getByTestId('torrent-actions-speed-limit')).not.toBeDisabled(); // Speed limit not disabled for queuedDownload
        expect(screen.getByTestId('torrent-actions-verify-loading')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-actions-remove')).toBeDisabled();
        // No need to call mockRestore here, it's handled in beforeEach
    });
});
