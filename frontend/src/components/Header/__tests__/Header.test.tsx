import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';
import { LocalizationProvider } from '@contexts/LocalizationContext';
// Импортируем ThemeProvider из контекста темы
import { ThemeProvider } from '@contexts/ThemeContext';
import { Theme as RadixTheme } from '@radix-ui/themes'; // Оставляем RadixTheme для стилизации

describe('Компонент Header', () => {
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
      // Оборачиваем в наш ThemeProvider
      <ThemeProvider>
        {/* Оставляем RadixTheme для стилей */}
        <RadixTheme>
          <LocalizationProvider>
            <Header {...defaultProps} {...props} />
          </LocalizationProvider>
        </RadixTheme>
      </ThemeProvider>
    );
  };

  it('отрисовывается без ошибок', () => {
    renderHeader();
    expect(screen.getByTestId('header-main')).toBeInTheDocument();
    // Дополнительная проверка на наличие ThemeToggle, который вызывает useTheme
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
  });

  it('обрабатывает изменения в поле поиска', () => {
    const setSearchTerm = vi.fn();
    renderHeader({ setSearchTerm });

    const searchInput = screen.getByTestId('header-search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(setSearchTerm).toHaveBeenCalledWith('test search');
  });

  it('отключает элементы управления при переподключении', () => {
    renderHeader({ isReconnecting: true });

    const searchInput = screen.getByTestId('header-search-input');
    expect(searchInput).toBeDisabled();
  });

  it('отображает сообщение об ошибке при его наличии', () => {
    const error = 'Test error message';
    renderHeader({ error });

    const errorElement = screen.getByTestId('header-error-message');
    expect(errorElement).toHaveTextContent(error);
  });

  it('не отображает сообщение об ошибке при отсутствии ошибки', () => {
    renderHeader({ error: undefined });

    const errorElements = screen.queryAllByTestId('header-error-message');
    expect(errorElements).toHaveLength(0);
  });

  it('обрабатывает функцию выбора всех элементов', () => {
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
      throw new Error('Чекбокс не найден');
    }

    fireEvent.click(checkbox);
    expect(onSelectAll).toHaveBeenCalled();
  });

  it('отображает индикаторы загрузки при выполнении действий', () => {
    renderHeader({
      startLoading: true,
      stopLoading: true,
      removeLoading: true,
      hasSelectedTorrents: true,
    });

    const spinners = screen.getAllByTestId('loading-spinner');
    expect(spinners).toHaveLength(3);
  });

  it('открывает диалог подтверждения удаления при нажатии на кнопку удаления', () => {
    renderHeader({
      hasSelectedTorrents: true,
      selectedTorrents: new Set([1]),
    });

    const removeButton = screen.getByTitle('remove.title');
    fireEvent.click(removeButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('обрабатывает переключение ограничения скорости', () => {
    const onSetSpeedLimit = vi.fn();
    renderHeader({
      onSetSpeedLimit,
      hasSelectedTorrents: true,
      hasRunningSelectedTorrents: true, // Добавляем это условие, так как теперь кнопка активна только при наличии активных торрентов
      isSlowModeEnabled: false,
    });

    const speedButton = screen.getByTitle('header.slowSpeed');
    fireEvent.click(speedButton);

    expect(onSetSpeedLimit).toHaveBeenCalledWith(true);
  });

  it('подтверждает удаление торрентов с опцией удаления данных', async () => {
    const onRemoveSelected = vi.fn();
    renderHeader({
      hasSelectedTorrents: true,
      selectedTorrents: new Set([1, 2]),
      onRemoveSelected,
    });

    // Открываем диалог удаления
    const removeButton = screen.getByTitle('remove.title');
    fireEvent.click(removeButton);

    // Находим чекбокс удаления данных и отмечаем его
    const checkbox = screen.getByTestId('delete-dialog-checkbox');
    fireEvent.click(checkbox);

    // Находим и нажимаем кнопку подтверждения по data-testid
    const confirmButton = screen.getByTestId('delete-dialog-confirm');
    fireEvent.click(confirmButton);

    // Проверяем что вызвана функция с параметром true
    expect(onRemoveSelected).toHaveBeenCalledWith(true);

    // Проверяем что диалог закрылся
    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      expect(dialog).toBeNull();
    });
  });

  it('отменяет удаление торрентов при нажатии на кнопку отмены', async () => {
    const onRemoveSelected = vi.fn();
    renderHeader({
      hasSelectedTorrents: true,
      selectedTorrents: new Set([1]),
      onRemoveSelected,
    });

    // Открываем диалог удаления
    const removeButton = screen.getByTitle('remove.title');
    fireEvent.click(removeButton);

    // Находим и нажимаем кнопку отмены по data-testid
    const cancelButton = screen.getByTestId('delete-dialog-cancel');
    fireEvent.click(cancelButton);

    // Проверяем что функция не вызвана
    expect(onRemoveSelected).not.toHaveBeenCalled();

    // Проверяем что диалог закрылся
    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      expect(dialog).toBeNull();
    });
  });

  it('открывает диалог настроек при нажатии на кнопку настроек', () => {
    const onSettings = vi.fn();
    renderHeader({ onSettings });

    const settingsButton = screen.getByLabelText('settings.title');
    fireEvent.click(settingsButton);

    expect(onSettings).toHaveBeenCalled();
  });

  it('открывает диалог добавления торрента при нажатии на кнопку добавления', () => {
    const onAddTorrent = vi.fn();
    renderHeader({ onAddTorrent });

    const addButton = screen.getByLabelText('add.title');
    fireEvent.click(addButton);

    expect(onAddTorrent).toHaveBeenCalled();
  });

  it('запускает выбранные торренты при нажатии на кнопку запуска', () => {
    const onStartSelected = vi.fn();
    renderHeader({
      onStartSelected,
      hasSelectedTorrents: true,
    });

    const startButton = screen.getByLabelText('torrents.startSelected');
    fireEvent.click(startButton);

    expect(onStartSelected).toHaveBeenCalled();
  });

  it('отображает корректное состояние при включенном режиме медленной скорости', () => {
    renderHeader({
      isSlowModeEnabled: true,
      hasSelectedTorrents: true,
      hasRunningSelectedTorrents: true
    });

    const speedButton = screen.getByTitle('header.normalSpeed');
    // Проверяем класс кнопки вместо data-атрибутов
    expect(speedButton).toHaveClass('rt-variant-solid');
    expect(speedButton).toHaveAttribute('data-accent-color', 'orange');
  });

  it('активирует кнопку замедления когда есть выбранные активные торренты', () => {
    renderHeader({
      hasSelectedTorrents: true,
      hasRunningSelectedTorrents: true
    });

    const speedButton = screen.getByTitle('header.slowSpeed');
    expect(speedButton).not.toBeDisabled();
  });

  it('деактивирует кнопку замедления когда нет выбранных активных торрентов', () => {
    renderHeader({
      hasSelectedTorrents: true,
      hasRunningSelectedTorrents: false
    });

    const speedButton = screen.getByTitle('torrents.noRunningSelectedForSpeedLimit');
    expect(speedButton).toBeDisabled();
  });

  it('показывает подсказку об отсутствии активных торрентов для кнопки замедления', () => {
    renderHeader({
      hasSelectedTorrents: true,
      hasRunningSelectedTorrents: false
    });

    const speedButton = screen.getByTitle('torrents.noRunningSelectedForSpeedLimit');
    expect(speedButton).toBeInTheDocument();
  });
});