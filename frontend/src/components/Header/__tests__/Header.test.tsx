import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';
import { LocalizationProvider } from '../../../contexts/LocalizationContext';
import { Theme } from '@radix-ui/themes';

describe('Header Component', () => {
  const defaultProps = {
    searchTerm: '',
    setSearchTerm: vi.fn(),
    onAddTorrent: vi.fn(),
    onSettings: vi.fn(),
    onStartSelected: vi.fn(),
    onStopSelected: vi.fn(),
    onRemoveSelected: vi.fn(),
    hasSelectedTorrents: false,
    startLoading: false,
    stopLoading: false,
    removeLoading: false,
    filteredTorrents: [],
    selectedTorrents: new Set<number>(),
    onSelectAll: vi.fn(),
    statusFilter: null,
    onStatusFilterChange: vi.fn(),
    torrents: [],
    onSetSpeedLimit: vi.fn(),
    isSlowModeEnabled: false,
    isReconnecting: false,
    isFirstStart: false,
  };

  const renderHeader = (props = {}) => {
    return render(
      <Theme>
        <LocalizationProvider>
          <Header {...defaultProps} {...props} />
        </LocalizationProvider>
      </Theme>
    );
  };

  it('renders without crashing', () => {
    renderHeader();
    expect(screen.getByTestId('header-main')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    const setSearchTerm = vi.fn();
    renderHeader({ setSearchTerm });

    const searchInput = screen.getByTestId('header-search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(setSearchTerm).toHaveBeenCalledWith('test search');
  });

  it('disables controls when reconnecting', () => {
    renderHeader({ isReconnecting: true });

    const searchInput = screen.getByTestId('header-search-input');
    expect(searchInput).toBeDisabled();
  });

  it('shows error message when provided', () => {
    const error = 'Test error message';
    renderHeader({ error });

    const errorElement = screen.getByTestId('header-error-message');
    expect(errorElement).toHaveTextContent(error);
  });

  it('handles select all functionality', () => {
    const onSelectAll = vi.fn();
    const filteredTorrents = [{ id: 1 }, { id: 2 }];

    renderHeader({
      onSelectAll,
      filteredTorrents,
      selectedTorrents: new Set([1, 2]),
    });

    const selectAllContainer = screen.getByTestId('header-select-all-container');
    const checkbox = selectAllContainer.querySelector('[role="checkbox"]');

    if (!checkbox) {
      throw new Error('Checkbox not found');
    }

    fireEvent.click(checkbox);
    expect(onSelectAll).toHaveBeenCalled();
  });

  it('shows loading spinners when actions are in progress', () => {
    renderHeader({
      startLoading: true,
      stopLoading: true,
      removeLoading: true,
      hasSelectedTorrents: true,
    });

    const spinners = screen.getAllByTestId('loading-spinner');
    expect(spinners).toHaveLength(3);
  });

  it('opens delete confirmation dialog on remove click', () => {
    renderHeader({
      hasSelectedTorrents: true,
      selectedTorrents: new Set([1]),
    });

    const removeButton = screen.getByTitle('remove.title');
    fireEvent.click(removeButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('handles speed limit toggle', () => {
    const onSetSpeedLimit = vi.fn();
    renderHeader({
      onSetSpeedLimit,
      hasSelectedTorrents: true,
      isSlowModeEnabled: false,
    });

    const speedButton = screen.getByTitle('header.slowSpeed');
    fireEvent.click(speedButton);

    expect(onSetSpeedLimit).toHaveBeenCalledWith(true);
  });
});