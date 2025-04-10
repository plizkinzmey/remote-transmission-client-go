import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { StatusFilter } from '../StatusFilter';
import { MockLocalizationProvider } from '../../../test/mocks/localization-context-mock';

describe('StatusFilter', () => {
    const defaultProps = {
        selectedStatus: null,
        onStatusChange: vi.fn(),
        hasNoTorrents: false,
        isReconnecting: false,
    };

    const renderComponent = (props = {}) => {
        return render(
            <MockLocalizationProvider>
                <StatusFilter {...defaultProps} {...props} />
            </MockLocalizationProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('отображает все кнопки фильтров', () => {
        renderComponent();
        expect(screen.getByTestId('status-filter-button-downloading')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-button-seeding')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-button-stopped')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-button-checking')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-button-queued')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-button-completed')).toBeInTheDocument();
        expect(screen.getByTestId('status-filter-button-slow')).toBeInTheDocument();
    });

    it('применяет правильные стили для активного фильтра', () => {
        renderComponent({ selectedStatus: 'downloading' });
        expect(screen.getByTestId('status-filter-button-downloading-active')).toHaveAttribute('data-variant', 'solid');
    });

    it('вызывает onStatusChange при клике по фильтру', () => {
        renderComponent();
        fireEvent.click(screen.getByTestId('status-filter-button-downloading'));
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith('downloading');
    });

    it('сбрасывает фильтр при повторном клике', () => {
        renderComponent({ selectedStatus: 'downloading' });
        fireEvent.click(screen.getByTestId('status-filter-button-downloading-active'));
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(null);
    });

    it('отключает кнопки при отсутствии торрентов', () => {
        renderComponent({ hasNoTorrents: true });
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            expect(button).toBeDisabled();
        });
    });

    it('отключает кнопки при переподключении', () => {
        renderComponent({ isReconnecting: true });
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('title', 'errors.needConnection');
        });
    });

    it('сбрасывает фильтр при переподключении', () => {
        const { rerender } = renderComponent({
            selectedStatus: 'downloading',
            isReconnecting: false
        });

        rerender(
            <MockLocalizationProvider>
                <StatusFilter
                    {...defaultProps}
                    selectedStatus="downloading"
                    isReconnecting={true}
                />
            </MockLocalizationProvider>
        );

        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(null);
    });

    it('обрабатывает множественные быстрые клики корректно', () => {
        renderComponent();
        const button = screen.getByTestId('status-filter-button-downloading');

        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        expect(defaultProps.onStatusChange).toHaveBeenCalledTimes(3);
    });
});